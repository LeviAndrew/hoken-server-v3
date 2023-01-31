import {BasicRest} from "../BasicRest";
import {Ehq} from "../../handlers/model/Ehq";
import {Session} from '../../handlers/authentication/Session'
import Handler from "../../handlers/model/Ehq";
import * as HTTPStatus from 'http-status-codes';

export class EhqRest extends BasicRest {
    // @ts-ignore
  protected _handler: Ehq;
  protected _sessionHandler: Session;

  constructor (router) {
    super(router, Handler);
    this._sessionHandler = new Session();
    this.routes = {
      post: {
        '/ehq/:entityId/:actionId/:method': this.callEhqAction.bind(this),
      },
    };

    this.wiring();
  }

  set handler (value: Ehq) {
    this._handler = value;
  }

  get handler (): Ehq {
    return this._handler;
  }

  set routes (rotas) {
    this._routes = rotas;
  }

  get routes () {
    return this._routes;
  }

  private async callEhqAction (request, response) {
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