import {Upload} from "../../handlers/model/Upload";
import {Session} from '../../handlers/authentication/Session'
import Handler from "../../handlers/model/Upload";
import * as HTTPStatus from 'http-status-codes';
import * as path from "path"
import {Types} from "mongoose";
import {BasicMulterRest} from "../BasicMulterRest";

export class UploadRest extends BasicMulterRest {
  // @ts-ignore
  protected _handler: Upload;
  protected _sessionHandler: Session;

  constructor (router) {
    super(router, Handler);
    this._sessionHandler = new Session();
    this.routes = {
      post: {
        '/upload/:entityId/:actionId/entitiesImport': this.entitiesImport.bind(this),
        '/upload/:entityId/:actionId/usersImport/:privilegeId': this.usersImport.bind(this),
      },
    };

    this.wiring();
  }

  set handler (value: Upload) {
    this._handler = value;
  }

  get handler (): Upload {
    return this._handler;
  }

  set routes (rotas) {
    this._routes = rotas;
  }

  get routes () {
    return this._routes;
  }

  private async entitiesImport (request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      const
        dest = path.resolve(`resources/tmp/`),
        documentName = new Types.ObjectId().toString();
      this.configureSingleMulter({
        acceptedTypes: [
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/octet-stream"
        ],
        fieldName: 'entitiesDocument',
        dest,
        documentName,
      })(request, response, async error => {
        if(error) {
          let message = "entitiesDocument";
          if(error.message) message = error.message;
          return response
            .status(HTTPStatus.OK)
            .send({success: false, data: message});
        }
        let ret = await this.handler.entitiesImport({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          data: {
            extname: path.extname(request.file.originalname),
            documentName,
            dest,
          },
        });
        response
          .status(HTTPStatus.OK)
          .send(ret);
      });
    } catch (e) {
      response
        .status(HTTPStatus.UNAUTHORIZED)
        .send(e);
    }
  }

  private async usersImport (request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      const
        dest = path.resolve(`resources/tmp/`),
        documentName = new Types.ObjectId().toString();
      this.configureSingleMulter({
        documentName,
        dest,
        fieldName: 'userDocument',
        acceptedTypes: [
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/octet-stream"
        ],
      })(request, response, async error => {
        if(error) {
          let message = "entitiesDocument";
          if(error.message) message = error.message;
          return response
            .status(HTTPStatus.OK)
            .send({success: false, data: message});
        }
        let ret = await this.handler.usersImport({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          entityId: request.params.entityId,
          data: {
            extname: path.extname(request.file.originalname),
            documentName,
            dest,
            privilege: request.params.privilegeId,
          },
        });
        response
          .status(HTTPStatus.OK)
          .send(ret);
      });
    } catch (e) {
      response
        .status(HTTPStatus.UNAUTHORIZED)
        .send(e);
    }
  }

}