import {BasicRest} from "../BasicRest";
import {Download} from "../../handlers/model/Download";
import {Session} from '../../handlers/authentication/Session'
import Handler from "../../handlers/model/Download";
import * as HTTPStatus from 'http-status-codes';

export class DownloadRest extends BasicRest {
  // @ts-ignore
  protected _handler: Download;
  protected _sessionHandler: Session;

  constructor (router) {
    super(router, Handler);
    this._sessionHandler = new Session();
    this.routes = {
      post: {
        '/download/:entityId/:actionId/entitiesXLSX': this.downloadEntitiesXLSX.bind(this),
      },
    };

    this.wiring();
  }

  set handler (value: Download) {
    this._handler = value;
  }

  get handler (): Download {
    return this._handler;
  }

  set routes (rotas) {
    this._routes = rotas;
  }

  get routes () {
    return this._routes;
  }

  private async downloadEntitiesXLSX (request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      let ret = await this.handler.entitiesToXLSX({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        data: {
          ids: [request.params.entityId],
        },
      });
      if(ret.success) return response
        .status(HTTPStatus.OK)
        .xls(`${ret.data.title}.xlsx`, ret.data.dataset);
      return response
        .status(HTTPStatus.OK)
        .send(ret);
    } catch (e) {
      response
        .status(HTTPStatus.UNAUTHORIZED)
        .send(e);
    }
  }

}