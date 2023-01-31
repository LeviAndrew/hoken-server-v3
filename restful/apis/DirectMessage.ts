import {BasicMulterRest} from "../BasicMulterRest";
import {DirectMessage} from "../../handlers/model/DirectMessage";
import {Session} from '../../handlers/authentication/Session'
import Handler from "../../handlers/model/DirectMessage";
import * as HTTPStatus from 'http-status-codes';
import * as path from "path";

export class DirectMessageRest extends BasicMulterRest {
  // @ts-ignore
  protected _handler: DirectMessage;
  protected _sessionHandler: Session;

  constructor(router) {
    super(router, Handler);
    this._sessionHandler = new Session();
    this.routes = {
      post: {
        '/directMessage/:entityId/:actionId/attachDocument/:messageId/:fileName': this.attachDocument.bind(this),
        '/directMessage/:entityId/:actionId/:method/': this.callDirectMessageAction.bind(this),
      },
    };

    this.wiring();
  }

  set handler(value: DirectMessage) {
    this._handler = value;
  }

  get handler(): DirectMessage {
    return this._handler;
  }

  set routes(rotas) {
    this._routes = rotas;
  }

  get routes() {
    return this._routes;
  }

  private async callDirectMessageAction(request, response) {
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

  private async attachDocument(request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      const
        originalName = request.params.fileName,
        extension = path.extname(request.params.fileName),
        contentLength = request.headers['content-length'],
        acceptedTypes = require(path.resolve('config.json')).drive.acceptedTypes,
        dest = path.resolve('resources/tmp/')
      this.configureSingleMulter({
        acceptedTypes,
        fieldName: "localFile",
        dest,
        documentName: request.params.messageId,
      })(request, response, async error => {
        if (error) {
          const message = error.message ? error.message : 'uploadFile';
          return response
            .status(HTTPStatus.OK)
            .send({success: false, data: message});
        }
        const message = await this.handler.sendMessageWithAttachment({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          entityId: request.params.entityId,
          data: {
            documentName: originalName,
            messageId: request.params.messageId,
            dest: `${dest}/${request.params.messageId}${extension}`,
          },
        });
        response
          .status(HTTPStatus.OK)
          .send(message);
      });
    } catch (e) {
      response
        .status(HTTPStatus.UNAUTHORIZED)
        .send(e);
    }
  }
}