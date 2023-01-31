import {BasicHandler} from '../handlers/BasicHandler'
import {Types} from "mongoose";
import {FindObject} from "../handlers/util/FindObject";
import {UpdateObject} from "../handlers/util/UpdateObject";

export class AccessController extends BasicHandler {
  private readonly _keysMap;
  private readonly _name: string;

  constructor () {
    super();
    this._keysMap = new Map();
    this._name = "accessSession";
    this.wiring();
  }

  private get name () {
    return this._name;
  }

  private get map () {
    return this._keysMap;
  };

  private async accessSessionCreate (msg) {
    if(msg.source_id === this.id) return;
    try {
      if(!msg.data.success) return this.answer(msg.id, msg.event, null, 'invalidAuthenticationKey');
      let timeStamp = new Date().getTime();
      let accessKey = new Types.ObjectId().toString();
      await this.createDbSession({
        authenticationKey: msg.data.success,
        accessKey,
      });
      this.map.set(msg.data.success, {
        timeStamp,
        accessKey,
      });
      this.answer(msg.id, msg.event, accessKey, null);
    } catch (e) {
      this.answer(msg.id, msg.event, null, e.message || e);
    }
  }

  private isValid (msg) {
    if(msg.source_id === this.id) return;
    if(this.map.get(msg.data.success.authenticationKey)) {
      if(this.map.get(msg.data.success.authenticationKey).accessKey === msg.data.success.accessKey) {
        return this.answer(msg.id, msg.event, true, null);
      }
    }
    return this.answer(msg.id, msg.event, null, true);
  }

  private removeKey (msg) {
    if(msg.source_id === this.id) return;
    if(this.map.get(msg.data.success.authenticationKey)) {
      if(this.map.get(msg.data.success.authenticationKey).accessKey === msg.data.success.accessKey) {
        this.map.delete(msg.data.success.authenticationKey);
        return this.answer(msg.id, msg.event, true, null);
      }
      return this.answer(msg.id, msg.event, null, 'invalidAccessKey');
    }
    return this.answer(msg.id, msg.event, null, 'invalidAuthenticationKey');
  }

  private async createDbSession (param: { authenticationKey: string, accessKey: string }) {
    try {
      const sessionRet = await this.sendToServer('db.session.count', new FindObject({
        query: param.authenticationKey,
      }));
      if(!sessionRet.data.error && !sessionRet.data.success) {
        const sessionCreated = await this.sendToServer('db.session.create', {
          _id: param.authenticationKey,
          accessKey: param.accessKey,
        });
        if(!sessionCreated.data.success || sessionCreated.data.error) throw new Error('weCantCreateSession');
        return;
      }
      const sessionUpdate = await this.sendToServer('db.session.update', new UpdateObject({
        query: param.authenticationKey,
        update: {
          accessKey: param.accessKey,
          mainEntities: [],
        }
      }));
      if(!sessionUpdate.data.success || sessionUpdate.data.error) throw new Error('weCantCreateSession');
      return;
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   *
   * @param messageId
   * @param event
   * @param success
   * @param error
   *
   * Make a answer to a message represented for a messageId param.
   */
  answer (messageId, event, success, error) {
    let data = {
      success: success,
      error: error
    };
    this.hub.send(this, event, data, messageId);
  }

  wiring () {
    this.hub.on(`${this.name}.create`, this.accessSessionCreate.bind(this));
    this.hub.on(`${this.name}.isValid`, this.isValid.bind(this));
    this.hub.on(`${this.name}.removeKey`, this.removeKey.bind(this));
  }
}