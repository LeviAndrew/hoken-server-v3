import {Source} from '../events/Source'
import {FindObject} from "../handlers/util/FindObject";

export class GameGroup extends Source {
  private readonly nick: string;
  private readonly teamId: string;
  private readonly gameId: string;
  private readonly teamPin: number;
  private _teacherSocket: any;
  private playersPerTeam;
  private players;
  private onStudentDisconnect: any;

  constructor(nick: string, playersPerTeam: number, teamId: string, gameId: string, teamPin: number, onStudentDisconnect: any, players: any[]) {
    super();
    this.nick = nick;
    this.teamId = teamId;
    this.gameId = gameId;
    this.playersPerTeam = playersPerTeam;
    this.players = [];
    this.teamPin = teamPin;
    if (players.length) this.setPlayers(players);
    this.onStudentDisconnect = onStudentDisconnect;
  }

  private setPlayers(players: any[]) {
    players.forEach(player => {
      this.players.push({
        socket: null,
        playerId: player._id.toString(),
        gameId: this.gameId,
        teamId: this.teamId,
        nick: player.nick,
        pin: player.pin,
      })
    });
  }

  public set teacherSocket(teacherSocket) {
    this._teacherSocket = teacherSocket;
  }

  public async addPlayer(player) {
    this.addPlayerListeners(player);
    const
      pin = `${this.players.length}${this.teamPin}`;
    this.players.push({...player, pin});
    await this.sendToServer('db.gameBase.updatePlayerPin', {
      id: player.gameId,
      team: player.teamId,
      player: player.playerId,
      pin,
    });
    this._teacherSocket.emit('student.enterBase', {
      success: {
        playerId: player.playerId,
        teamId: player.teamId,
        nick: player.nick,
        pin,
      }
    });
  }

  private addPlayerListeners(player) {
    player.socket.removeAllListeners();
    player.socket.on('player.takeDecisionBase', this.takeDecision.bind(this));
    const me = this;
    player.socket.on("disconnect", function () {
      me.getStudentDisconnected(this.id);
    });
  }

  public async reconnectPlayer(param: { socket: any, playerPin: string }) {
    const game = await this.sendToServer('db.gameBase.read', new FindObject({
        query: this.gameId,
        select: 'teams',
      }));
    if (!game.data.success || game.data.error || !game.data.success.teams) param.socket.emit('player.reconnectBase.error', {error: 'invalidGame'});
    let player;
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].pin === param.playerPin && !this.players[i].socket) {
        player = this.players[i];
        break;
      }
    }
    if (!player) return;
    player.socket = param.socket;
    this.addPlayerListeners(player);
    const
      teamDB = game.data.success.teams.filter(team => team._id.toString() === this.teamId);
    if (!teamDB.length) return this.playerReconnectError(player, 'invalidTeam');
    const
      playerDB = teamDB[0].players.filter(pDB => pDB._id.toString() === player.playerId);
    if (!playerDB.length) return this.playerReconnectError(player, 'invalidPlayer');
    return player.socket.emit('player.reconnectBase', {
      playerId: player.playerId,
      gameId: player.gameId,
      teamId: player.teamId,
      nick: player.nick,
      teacher: player.teacher,
      playedArray: playerDB[0].playedArray,
    });
  }

  private playerReconnectError(player, error: string) {
    player.socket.emit('player.reconnectBase.error', {error: error});
    player.socket.removeAllListeners();
    player.socket = null;
  }

  private getStudentDisconnected(socketId) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].socket && this.players[i].socket.id === socketId) {
        this.onStudentDisconnect(this.players[i].teamId, this.players[i].playerId);
        this.players[i].socket.removeAllListeners();
        this.players[i].socket = null;
      }
    }
  }

  public async takeDecision(data) {
    const
      player = this.players.find(player => player.playerId === data.request.playerId),
      event = "decision.receivedBase",
      game = await this.sendToServer('db.game.read', new FindObject({
        query: this.gameId,
        select: 'gameStatus',
      }));
    if (!game.data.success || game.data.error) {
      return player.socket.emit(event, {error: 'invalidGame'});
    }
    if (!game.data.success.gameStatus || game.data.success.gameStatus !== 'started') return player.socket.emit(event, {error: 'gameNotStarted'});
    return player.socket.emit(event, {success: 'ok'});
  }

  public sendDataEvent(event, msg) {
    this.players.forEach(player => {
      if (!player.socket) return;
      player.socket.emit(event, msg);
    });
  }

}