import {BasicMulterRest} from "../BasicMulterRest";
import {CollaborativeWork} from "../../handlers/model/CollaborativeWork";
import {Session} from '../../handlers/authentication/Session'
import Handler from "../../handlers/model/CollaborativeWork";
import * as HTTPStatus from 'http-status-codes';
import {Types} from "mongoose";
import * as path from "path";

export class CollaborativeWorkRest extends BasicMulterRest {
  // @ts-ignore
  protected _handler: CollaborativeWork;
  protected _sessionHandler: Session;

  constructor(router) {
    super(router, Handler);
    this._sessionHandler = new Session();
    this.routes = {
      post: {
        '/collaborativeWork/:entityId/:actionId/addLocalFile/:fileName/:collaborativeWorkId': this.addLocalFile.bind(this),
        '/collaborativeWork/:entityId/:actionId/downloadFile': this.downloadFile.bind(this),
        '/collaborativeWork/:entityId/:actionId/downloadFileAnswer': this.downloadFileAnswer.bind(this),
        '/collaborativeWork/:entityId/:actionId/downloadZipAnswers': this.downloadZipAnswers.bind(this),
        '/collaborativeWork/:entityId/:actionId/attachAnswerFile/:collaborativeWorkAnswerId/:teamId/:answerId/:fileName': this.attachCollaborativeWorkAnswerFile.bind(this),
        '/collaborativeWork/:entityId/:actionId/:method/': this.callCollaborativeWorkAction.bind(this),
      },
    };

    this.wiring();
  }

  set handler(value: CollaborativeWork) {
    this._handler = value;
  }

  get handler(): CollaborativeWork {
    return this._handler;
  }

  set routes(rotas) {
    this._routes = rotas;
  }

  get routes() {
    return this._routes;
  }

  private async callCollaborativeWorkAction(request, response) {
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

  private async downloadFile(request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      let ret = await this.handler.downloadCollaborativeWorkFile({
        entityId: request.params.entityId,
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        data: {
          collaborativeWorkId: request.body.collaborativeWorkId,
          fileId: request.body.fileId
        },
      });
      if (!ret.success) return response.status(HTTPStatus.OK).send(ret);
      response
        .status(HTTPStatus.OK)
        .download(path.resolve(ret.data.path), `${ret.data.name}${ret.data.extension}`);
    } catch (e) {
      response
        .status(HTTPStatus.UNAUTHORIZED)
        .send(e);
    }
  }

  private async downloadFileAnswer(request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      let ret = await this.handler.downloadFileAnswer({
        entityId: request.params.entityId,
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        data: {
          collaborativeWorkAnswerId: request.body.collaborativeWorkAnswerId,
          teamId: request.body.teamId,
          answerId: request.body.answerId,
          fileId: request.body.fileId
        },
      });
      if (!ret.success) return response.status(HTTPStatus.OK).send(ret);
      response
        .status(HTTPStatus.OK)
        .download(path.resolve(ret.data.path), `${ret.data.name}`);
    } catch (e) {
      response
        .status(HTTPStatus.UNAUTHORIZED)
        .send(e);
    }
  }

  private async downloadZipAnswers(request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      let ret = await this.handler.downloadZipAnswers({
        entityId: request.params.entityId,
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        data: {
          collaborativeWorkId: request.body.collaborativeWorkId,
        },
      });
      if (!ret.success) return response.status(HTTPStatus.OK).send(ret);
      response
        .status(HTTPStatus.OK)
        .zip(ret.data);
    } catch (e) {
      response
        .status(HTTPStatus.UNAUTHORIZED)
        .send(e);
    }
  }

  private async attachCollaborativeWorkAnswerFile(request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      const
        documentName = new Types.ObjectId().toString(),
        originalName = request.params.fileName,
        acceptedTypes = require(path.resolve('config.json')).drive.acceptedTypes,
        answerPath = await this.handler.readCollaborativeWorkAnswerFolder({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          entityId: request.params.entityId,
          data: {
            collaborativeWorkAnswerId: request.params.collaborativeWorkAnswerId,
            answerId: request.params.answerId,
          },
        })
      this.configureSingleMulter({
        acceptedTypes,
        fieldName: "localFile",
        dest: answerPath.data,
        documentName,
      })(request, response, async error => {
        if (error) {
          const message = error.message ? error.message : 'uploadFile';
          return response
            .status(HTTPStatus.OK)
            .send({success: false, data: message});
        }
        const ret = await this.handler.setCollaborativeWorkAnswerFile({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          entityId: request.params.entityId,
          data: {
            collaborativeWorkAnswerId: request.params.collaborativeWorkAnswerId,
            answerId: request.params.answerId,
            filePath: request.file.path,
            fileName: originalName,
            teamId: request.params.teamId,
          },
        })
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

  private async addLocalFile(request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      await this.handler.checkExistCollaborativeWork({
        collaborativeWorkId: request.params.collaborativeWorkId
      });
      const
        documentName = new Types.ObjectId().toString(),
        originalName = request.params.fileName.substring(0, request.params.fileName.lastIndexOf('.')),
        extension = path.extname(request.params.fileName),
        contentLength = request.headers['content-length'],
        acceptedTypes = require(path.resolve('config.json')).drive.acceptedTypes,
        collaborativeWorkFolder = await this.handler.readCollaborativeWorkFolder({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          entityId: request.params.entityId,
          data: null,
        });
      if (!collaborativeWorkFolder.success) return response
        .status(HTTPStatus.OK)
        .send(collaborativeWorkFolder);
      await this.handler.checkExistFile({
        userId: collaborativeWorkFolder.data.userId,
        parentId: request.query.parentId,
        name: originalName,
        extension: extension,
      });
      this.configureSingleMulter({
        acceptedTypes,
        fieldName: "localFile",
        dest: collaborativeWorkFolder.data.folder.path,
        documentName,
      })(request, response, async error => {
        if (error) {
          const message = error.message ? error.message : 'uploadFile';
          return response
            .status(HTTPStatus.OK)
            .send({success: false, data: message});
        }
        const file = await this.handler.createFile({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          userId: collaborativeWorkFolder.data.userId,
          data: {
            fileId: documentName,
            parentId: collaborativeWorkFolder.data.folder.id,
            extension,
            name: originalName,
            path: `${collaborativeWorkFolder.data.folder.path}/${documentName}${extension}`,
            size: contentLength,
          },
        });
        if (!file.success) return response
          .status(HTTPStatus.OK)
          .send(file);
        const ret = await this.handler.addCollaborativeWorkFile({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          entityId: request.params.entityId,
          data: {
            fileId: file.data[0].id,
            collaborativeWorkId: request.params.collaborativeWorkId,
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