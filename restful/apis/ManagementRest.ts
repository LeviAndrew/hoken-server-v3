import {BasicRest} from "../BasicRest";
import {Management} from "../../handlers/model/Management";
import {Session} from '../../handlers/authentication/Session'
import Handler from "../../handlers/model/Management";
import * as HTTPStatus from 'http-status-codes';

export class ManagementRest extends BasicRest {
  // @ts-ignore
  protected _handler: Management;
  protected _sessionHandler: Session;

  constructor (router) {
    super(router, Handler);
    this._sessionHandler = new Session();
    this.routes = {
      post: {
        '/management/:entityId/:actionId/:method': this.callManagementAction.bind(this),
      },
    };

    this.wiring();
  }

  set handler (value: Management) {
    this._handler = value;
  }

  get handler (): Management {
    return this._handler;
  }

  set routes (rotas) {
    this._routes = rotas;
  }

  get routes () {
    return this._routes;
  }

  private async callManagementAction (request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      let ret = await this.handler[request.params.method]({
        entityId: request.params.entityId,
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        data: request.body,
      });
      response
        .status(HTTPStatus.OK)
        .send(ret);
    } catch (e) {
      response
        .status(HTTPStatus.UNAUTHORIZED)
        .send(e);
    }
  }

}