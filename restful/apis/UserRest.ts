import {BasicRest} from "../BasicRest";
import {User} from "../../handlers/model/User";
import Handler from "../../handlers/model/User";
import * as HTTPStatus from 'http-status-codes';

export class UserRest extends BasicRest {
  // @ts-ignore
  protected _handler: User;

  constructor (router) {
    super(router, Handler);

    this.routes = {
      post: {
        '/user/logout': this.logout.bind(this),
        '/user/password': this.updatePassword.bind(this),
      },
      get: {
        '/user/entities': this.entitiesRead.bind(this),
        '/user/entity/children/:entityId': this.entityChildrenRead.bind(this),
      }
    };

    this.wiring();
  }

  set handler (value: User) {
    this._handler = value;
  }

  get handler (): User {
    return this._handler;
  }

  set routes (rotas) {
    this._routes = rotas;
  }

  get routes () {
    return this._routes;
  }

  private async logout (request, response) {
    let ret = await this.handler.logout({
      auth: request.headers['authentication-key'],
      aKey: request.headers['access-key'],
    });
    response
      .status(HTTPStatus.OK)
      .send(ret);
  }

  private async updatePassword (request, response) {
    let ret = await this.handler.updatePassword({
      auth: request.headers['authentication-key'],
      currentPassword: request.body.currentPassword,
      newPassword: request.body.newPassword,
    });
    response
      .status(HTTPStatus.OK)
      .send(ret);
  }

  private async entitiesRead (request, response) {
    let ret = await this.handler.entitiesRead({
      auth: request.headers['authentication-key'],
    });
    response
      .status(HTTPStatus.OK)
      .send(ret);
  }

  private async entityChildrenRead (request, response) {
    let ret = await this.handler.entityChildrenRead({
      auth: request.headers['authentication-key'],
      entityId: request.params.entityId,
    });
    response
      .status(HTTPStatus.OK)
      .send(ret);
  }

}