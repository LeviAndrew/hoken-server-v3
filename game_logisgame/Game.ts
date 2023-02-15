import {GameGroup} from './GameGroup'
import {Source} from '../events/Source'
import {UpdateObject} from "../handlers/util/UpdateObject";
import {FindObject} from "../handlers/util/FindObject";
import {finished} from "stream";

export class Game extends Source {
  private readonly groupMap;
  private readonly gameId: string;
  private teacherSocket;
  private gameConfig;
  private pin;
  private interval;
  private count;
  private readonly teacherId: string;

  constructor(gameConfig, teams, gameId: string, pin: string, teacherId) {
    super();
    this.groupMap = new Map();
    this.gameConfig = gameConfig;
    this.gameId = gameId;
    this.pin = pin;
    this.count = this.gameConfig.time;
    this.teacherId = teacherId;
    this.setGroups(teams, gameConfig.playersPerTeam);
  }

  private setGroups(teams: group[], playersPerTeam) {
    teams.forEach((team, index) => {
      const
        teamId = team.id || team._id.toString();
      this.groupMap.set(
        teamId,
        new GameGroup(team.nick,
          playersPerTeam,
          teamId,
          this.gameId,
          index + 1,
          this.onStudentDisconnect.bind(this),
          team.players,
          this.onTeamFinishedPlayed.bind(this),
        ));
    });
  }

  public setTeacher(teacherSocket) {
    this.teacherSocket = teacherSocket;
    this.teacherWiring();
    for (let group of this.groupMap.values()) {
      group.teacherSocket = teacherSocket;
    }

  }

  private async onStudentDisconnect(teamId, playerId) {
    await this.changeStatus({
      request: {
        "status": "paused"
      },
    });
    this.teacherSocket.emit('student.disconnectLogis', {
      teamId,
      playerId,
    });
  }

  public async setNewPlayer(param: playerData) {
    const
      team = this.groupMap.get(param.teamId);
    await team.addPlayer(param);
  }

  public playerReconnect(param: { socket: any, playerPin: string }) {
    for (const team of this.groupMap.values()) {
      team.reconnectPlayer(param);
    }
  }

  private sendToGroups(event, msg) {
    for (let group of this.groupMap.values()) {
      group.sendDataEvent(event, msg);
    }
  }

  private async changeStatus(msg) {
    const responseEvent = 'gameLogis.status.changed';
    try {
      await this.updateStatus(msg.request.status);
      const
        ret = await this.sendToServer('db.gameLogis.read', new FindObject({
          query: this.gameId,
          select: 'id gameStatus teams',
        }));
      if (!ret.data.success || ret.data.error) return this.teacherSocket.emit(responseEvent, {
        ...msg,
        response: {error: 'cantUpdateGameStatus'}
      });
      const
        response = {success: ret.data.success};
      this.sendToGroups(responseEvent, response);
      clearInterval(this.interval);
      if (ret.data.success.gameStatus === "started") {
        if (this.gameConfig.timer && this.gameConfig.time && this.gameConfig.async) {
          for (let gp of this.groupMap.values()) {
            gp.groupTimer(this.gameConfig.time);
          }
        } else {
          this.timerController();
        }
      }
      return this.teacherSocket.emit(responseEvent, {
        ...msg,
        response,
      });
    } catch (e) {
      return this.teacherSocket.emit(responseEvent, {
        ...msg,
        response: {
          error: e.message || e
        }
      });
    }
  }

  private async removeGroup(msg) {
    const event = "gameLogis.group.removed";
    try {
      if (!msg.teamId) return this.teacherSocket.emit(event, {
        response: {
          error: "teamIdRequired",
        }
      });
      if (this.groupMap.size < 3) return this.teacherSocket.emit(event, {
        response: {
          error: "alreadyHaveTwoGroups",
        }
      });
      const
        groupToRemove = this.groupMap.get(msg.teamId);
      if (!groupToRemove) return this.teacherSocket.emit(event, {
        response: {
          error: "invalidTeam",
        }
      });
      groupToRemove.removeGroupData();
      const
        ret = await this.sendToServer('db.gameLogis.removeTeam', {
          teamId: msg.teamId,
          gameId: this.gameId
        });
      if (!ret.data.success || ret.data.error) return this.teacherSocket.emit(event, {
        response: {
          error: "cannotRemoveTeam",
        }
      });
      this.groupMap.delete(msg.teamId);
      return this.teacherSocket.emit(event, {
        response: {
          success: ret.data.success,
        }
      });
    } catch (e) {
      return this.teacherSocket.emit(event, {
        response: {
          error: e.message || e
        }
      });
    }
  }

  private async removePlayer(msg) {
    const event = "gameLogis.player.removed";
    try {
      if (!msg.teamId || !msg.playerId) return this.teacherSocket.emit(event, {
        response: {
          error: "teamIdAndPlayerIdRequired",
        }
      });
      const
        game = await this.sendToServer('db.gameLogis.read', new FindObject({
          query: this.gameId,
          select: "id gameStatus"
        }));
      if (!game.data.success || game.data.error) return this.teacherSocket.emit(event, {
        response: {
          error: "cannotReadGame",
        }
      });
      if (game.data.success.gameStatus !== "created") return this.teacherSocket.emit(event, {
        response: {
          error: "gameAlreadyStarted",
        }
      });
      const groupToRemove = this.groupMap.get(msg.teamId);
      if (!groupToRemove) return this.teacherSocket.emit(event, {
        response: {
          error: "invalidTeam",
        }
      });
      groupToRemove.removePlayer(msg.playerId);
      const ret = await this.sendToServer('db.gameLogis.removePlayer', {
          teamId: msg.teamId,
          gameId: this.gameId,
          playerId: msg.playerId
        });
      if (!ret.data.success || ret.data.error) return this.teacherSocket.emit(event, {
        response: {
          error: "cannotRemoveTeam",
        }
      });
      return this.teacherSocket.emit(event, {
        response: {
          success: ret.data.success,
        }
      });
    } catch (e) {
      return this.teacherSocket.emit(event, {
        response: {
          error: e.message || e
        }
      });
    }
  }

  private async updateStatus(status) {
    if (!new Set([
      'created', 'started', 'paused', 'finished'
    ]).has(status)) throw new Error('invalidStatus');
    if (status === 'started') {
      for (let team of this.groupMap.values()) {
        if (!team.checkStudentsIn()) throw new Error('missingPlayers');
      }
    }
    const gameDB = await this.sendToServer('db.gameLogis.read', new FindObject({
        query: this.gameId,
        select: 'gameStatus',
      }));
    if (!gameDB.data.success || gameDB.data.error) throw new Error('cannotReadGameStatus');
    if (gameDB.data.success.gameStatus === 'finished') throw new Error('gameAlreadyFinished');
    const
      statusGoTo = {
        created: ['started', 'finished'],
        started: ['paused', 'finished'],
        paused: ['started', 'finished'],
        finished: [],
      };
    if (!new Set(statusGoTo[gameDB.data.success.gameStatus]).has(status)) throw new Error('cannotGoToStatus');
    const updatedGame = await this.sendToServer('db.gameLogis.update', new UpdateObject({
        query: this.gameId,
        update: {
          gameStatus: status,
        }
      }));
    if (!updatedGame.data.success || updatedGame.data.error) throw new Error('cannotUpdateGameStatus');
  }

  private async teacherDisconnect(msg) {
    try {
      await this.updateStatus('paused')
      clearInterval(this.interval);
      const ret = await this.sendToServer('db.gameLogis.read', new FindObject({
          query: this.gameId,
          select: 'id gameStatus',
        }));
      const
        response = {success: ret.data.success};
      this.sendToGroups("teacher.disconnectLogis", response);
    } catch (e) {
      return e;
    }
  }

  private timerController() {
    if (!this.gameConfig.timer || !this.gameConfig.time || this.gameConfig.async) return;
    const jump = 5;
    this.interval = setInterval(async () => {
      this.count -= jump;
      this.syncTimer(this.count);
      if (this.count <= 0) {
        this.endTime();
        this.count = this.gameConfig.time;
      }
    }, jump * 1000);
  }

  private syncTimer(currentTime) {
    const event = 'sync.timer';
    this.teacherSocket.emit(event, {currentTime});
    this.sendToGroups(event, {currentTime});
  }

  private endTime() {
    for (let gp of this.groupMap.values()) {
      gp.endTime();
    }
    this.onTeamFinishedPlayed(null);
  }

  private async onTeamFinishedPlayed(team) {
    try {
      if (!this.gameConfig.async) {
        for (let gp of this.groupMap.values()) {
          if (!gp.finisehd) return;
        }
        await this.syncGame();
      } else {
        await this.asyncGame(team);
      }
      for (let gp of this.groupMap.values()) {
        if (!gp.finishedGameGroup) return this.timerController();
      }
      const
        ret = await this.sendToServer('db.gameLogis.update', new UpdateObject({
          query: this.gameId,
          update: {
            gameStatus: 'finished',
          }
        }));
      if (!ret.data.success || ret.data.error) return this.teacherSocket.emit('gameLogis.finished', {error: 'weCannotFinishedGame'});
      this.teacherSocket.emit('gameLogis.finished', {success: true,});
    } catch (e) {
      console.error(e);
    }
  }

  private async asyncGame(team) {
    const game = await this.sendToServer('db.gameLogis.read', new FindObject({
        query: this.gameId,
        select: 'teams gameSetting'
      }));
    if (!game.data.success) throw 'invalidGame';
    let teamDB: any;
    for (let i = 0; i < game.data.success.teams.length; i++) {
      if (game.data.success.teams[i]._id.toString() === team.teamId) {
        teamDB = game.data.success.teams[i];
        break;
      }
    }
    team.toNextWeek(teamDB, game.data.success.gameSetting);
    const updateGame = await this.sendToServer('db.gameLogis.update', new UpdateObject({
        query: {
          "_id": this.gameId,
          "teams._id": teamDB._id,
        },
        update: {
          "teams.$.players": teamDB.players,
        },
      }));
    if (!updateGame.data.success || updateGame.data.error) throw 'cannotUpdateGame';
    const updatedGame = await this.sendToServer('db.gameLogis.read', new FindObject({
        query: this.gameId,
        select: 'teams'
      }));
    if (!updatedGame.data.success) throw 'cannotReadGame';
    for (let i = 0; i < updatedGame.data.success.teams.length; i++) {
      if (updatedGame.data.success.teams[i]._id.toString() === team.teamId) {
        team.emitNextWeek(updatedGame.data.success.teams[i]);
        if (this.gameConfig.timer && this.gameConfig.time && this.gameConfig.async) team.groupTimer(this.gameConfig.time);
        return;
      }
    }
  }

  private async syncGame() {
    clearInterval(this.interval);
    this.count = this.gameConfig.time;
    const game = await this.sendToServer('db.gameLogis.read', new FindObject({
        query: this.gameId,
        select: 'teams gameSetting'
      }));
    if (!game.data.success) throw 'invalidGame';
    game.data.success.teams.forEach(gp => {
      const group = this.groupMap.get(gp._id.toString());
      group.toNextWeek(gp, game.data.success.gameSetting);
    });
    const updateGame = await this.sendToServer('db.gameLogis.update', new UpdateObject({
        query: this.gameId,
        update: {
          teams: game.data.success.teams,
        },
      }));
    if (!updateGame.data.success) throw 'cantUpdateGame';
    updateGame.data.success.teams.forEach(gp => {
      const
        group = this.groupMap.get(gp._id.toString());
      group.emitNextWeek(gp);
    });
  }

  private teacherWiring() {
    this.teacherSocket.on("gameLogis.group.remove", this.removeGroup.bind(this));
    this.teacherSocket.on("gameLogis.player.remove", this.removePlayer.bind(this));
    this.teacherSocket.on("gameLogis.status.change", this.changeStatus.bind(this));
    this.teacherSocket.on("disconnectLogis", this.teacherDisconnect.bind(this));
  }

}

interface group {
  nick: string,
  id?: string,
  _id?: string,
  players: any[],
}

interface playerData {
  playerId: string,
  gameId: string,
  teamId: string,
  nick: string,
  teacher: string,
  socket: any,
}