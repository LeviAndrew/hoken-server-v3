import {GameGroup} from './GameGroup'
import {Source} from '../events/Source'
import {UpdateObject} from "../handlers/util/UpdateObject";

export class Game extends Source {
  private readonly groupMap;
  private readonly gameId: string;
  private teacherSocket;
  private gameConfig;
  private pin;
  private interval;
  private count;

  constructor(gameConfig, teams, gameId: string, pin: string) {
    super();
    this.groupMap = new Map();
    this.gameConfig = gameConfig;
    this.gameId = gameId;
    this.pin = pin;
    this.count = this.gameConfig.time;
    this.setGroups(teams, gameConfig.playersPerTeam);
  }

  private setGroups(teams: group[], playersPerTeam) {
    teams.forEach((team, index) => {
      const
        teamId = team.id || team._id.toString();
      this.groupMap.set(teamId, new GameGroup(team.nick, playersPerTeam, teamId, this.gameId, index + 1, this.onStudentDisconnect.bind(this), team.players));
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
    this.teacherSocket.emit('student.disconnectBase', {
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
    const responseEvent = 'gameBase.status.changed';
    try {
      const
        ret = await this.sendToServer('db.gameBase.update', new UpdateObject({
          query: this.gameId,
          update: {
            gameStatus: msg.request.status,
          },
          select: ['id', 'gameStatus'],
        }));
      if (!ret.data.success || ret.data.error) return this.teacherSocket.emit(responseEvent, {
        ...msg,
        response: {error: 'cantUpdateGameStatus'}
      });
      const
        response = {success: ret.data.success};
      this.sendToGroups(responseEvent, response);
      clearInterval(this.interval);
      if (ret.data.success.gameStatus === "started") this.timerController();
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

  private async teacherDisconnect(msg) {
    try {
      clearInterval(this.interval);
      const
        ret = await this.sendToServer('db.gameBase.update', new UpdateObject({
          query: this.gameId,
          update: {
            gameStatus: "paused"
          },
          select: ['id', 'gameStatus'],
        }));
      const
        response = {success: ret.data.success};
      this.sendToGroups("teacher.disconnectBase", response);
    } catch (e) {
      return e;
    }
  }

  private teacherWiring() {
    this.teacherSocket.on("gameBase.status.change", this.changeStatus.bind(this));
    this.teacherSocket.on("disconnectBase", this.teacherDisconnect.bind(this));
  }

  private timerController() {
    if (!this.gameConfig.timer || !this.gameConfig.time) return;
    const jump = 5;
    this.interval = setInterval(() => {
      this.count -= jump;
      this.syncTimer(this.count);
      if (this.count <= 0) this.count = this.gameConfig.time;
    }, jump * 1000);
  }

  private syncTimer(currentTime) {
    const event = 'sync.timer';
    this.teacherSocket.emit(event, {currentTime});
    this.sendToGroups(event, {currentTime});
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