import {BasicRTC} from './BasicRTC';
import {OpenHandler} from '../handlers/model/OpenHandler';
import Handler from '../handlers/model/OpenHandler';

export class OpenRTC extends BasicRTC {
  
  constructor(conf) {
    super('login', Handler, conf);
    this.interfaceListeners = {
      'teacherEnter': this.teacherEnter.bind(this),
      'playerEnter': this.playerEnter.bind(this),
      'playerReconnect': this.playerReconnect.bind(this),
    };
    this.wiring();
  }

  set handler(handler: OpenHandler) {
    this._handler = handler;
  }

  get handler(): OpenHandler {
    return this._handler;
  }

  set interfaceListeners(interfaceListeners: object) {
    this._interfaceListeners = interfaceListeners;
  }

  get interfaceListeners(): object {
    return this._interfaceListeners;
  }

  async teacherEnter(msg) {
    msg.response = await this.handler.teacherEnter({
      auth: msg.request.authenticationKey,
      data: {
        socket: this.socket,
      },
    });
    this.sendToBrowser(msg);
    this.destroy();
  }

  async playerEnter(msg) {
    msg.response = await this.handler.playerEnter({
      socket: this.socket,
      playerId: msg.request.playerId,
      gameId: msg.request.gameId,
      teamId: msg.request.teamId,
      nick: msg.request.nick,
      teacher: msg.request.teacher,
    });
    this.sendToBrowser(msg);
    if (msg.response && msg.response.success && msg.response.data) this.destroy();
  }

  async playerReconnect(msg) {
    msg.response = await this.handler.playerReconnect({
      socket: this.socket,
      gamePin: msg.request.gamePin,
      playerPin: msg.request.playerPin,
    });
    if (msg.response && msg.response.success && msg.response.data) this.destroy();
  }

}