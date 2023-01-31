import {BasicMulterRest} from "../BasicMulterRest";
import {SupportResource} from "../../handlers/model/SupportResource";
import {Session} from '../../handlers/authentication/Session'
import Handler from "../../handlers/model/SupportResource";
import * as HTTPStatus from 'http-status-codes';
import * as path from "path";
import {Types} from "mongoose";

export class SupportResourceRest extends BasicMulterRest {
  protected _handler: SupportResource;
  protected _sessionHandler: Session;

  constructor(router) {
    super(router, Handler);
    this._sessionHandler = new Session();
    this.routes = {
      post: {
        '/supportResource/:entityId/:actionId/addLocalFile/:fileName/:name': this.addLocalFile.bind(this),
        '/supportResource/:entityId/:actionId/addFileOnFolder/:fileName/:supportResourceId': this.addFileOnFolder.bind(this),
        '/supportResource/:entityId/:actionId/createFolder': this.createFolder.bind(this),
        '/supportResource/:entityId/:actionId/createLink': this.createLink.bind(this),
        '/supportResource/:entityId/:actionId/downloadSupportResource/': this.downloadSupportResource.bind(this),
        '/supportResource/:entityId/:actionId/:method/': this.callSupportResourceAction.bind(this),
      },
      get: {
        '/supportResource/:supportResourceId/folder': this.getFolderContent.bind(this),
      },
      delete: {
        '/supportResource/file/:fileId' : this.deleteFile.bind(this),
        '/supportResource/folder/:folderId' : this.deleteFolder.bind(this),
        '/supportResource/link/:linkId' : this.deleteLink.bind(this),
      }
    };

    this.wiring();
  }

  set handler(value: SupportResource) {
    this._handler = value;
  }

  get handler(): SupportResource {
    return this._handler;
  }

  set routes(rotas) {
    this._routes = rotas;
  }

  get routes() {
    return this._routes;
  }

  private async addLocalFile(request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      const
        supportResourceFolder = await this.handler.readSupportResourceFolder({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          entityId: request.params.entityId,
          data: null,
        }),
        documentName = new Types.ObjectId().toString(),
        originalName = request.params.name,
        extension = path.extname(request.params.fileName),
        contentLength = request.headers['content-length'],
        acceptedTypes = require(path.resolve('config.json')).drive.acceptedTypes;
      await this.handler.checkExistFile({
        userId: supportResourceFolder.data.userId,
        parentId: request.query.parentId,
        name: originalName,
        extension: extension,
      });
      this.configureSingleMulter({
        acceptedTypes,
        fieldName: "localFile",
        dest: supportResourceFolder.data.folder.path,
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
          userId: supportResourceFolder.data.userId,
          data: {
            fileId: documentName,
            parentId: supportResourceFolder.data.folder.id,
            extension,
            name: originalName,
            path: `${supportResourceFolder.data.folder.path}/${documentName}${extension}`,
            size: contentLength,
          },
        });
        if (!file.success) return response
          .status(HTTPStatus.OK)
          .send(file);
        const ret = await this.handler.createSupportResourceLocalFile({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          entityId: request.params.entityId,
          data: {
            owner: supportResourceFolder.data.userId,
            name: request.params.name,
            fileId: file.data[0].id,
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

  private async addFileOnFolder(request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      const
        supportResourceFolder = await this.handler.readFolderBySupportResourceId({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          entityId: request.params.entityId,
          data: {
            supportResourceId: request.params.supportResourceId,
            parentId: request.query.parentId,
          },
        }),
        documentName = new Types.ObjectId().toString(),
        originalName = request.params.fileName.substring(0, request.params.fileName.lastIndexOf('.')),
        extension = path.extname(request.params.fileName),
        contentLength = request.headers['content-length'],
        acceptedTypes = require(path.resolve('config.json')).drive.acceptedTypes;
      await this.handler.checkExistFile({
        userId: supportResourceFolder.data.userId,
        parentId: request.query.parentId,
        name: originalName,
        extension: extension,
      });
      this.configureSingleMulter({
        acceptedTypes,
        fieldName: "localFile",
        dest: supportResourceFolder.data.folder.success,
        documentName,
      })(request, response, async error => {
        if (error) {
          const message = error.message ? error.message : 'uploadFile';
          return response
            .status(HTTPStatus.OK)
            .send({success: false, data: message});
        }
        let folderFile = request.query.parentId;
        if (!request.query.parentId){ folderFile = supportResourceFolder.data.folder.id}
        const file = await this.handler.createFile({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          userId: supportResourceFolder.data.userId,
          data: {
            fileId: documentName,
            parentId: folderFile,
            extension,
            name: originalName,
            path: `${supportResourceFolder.data.folder.success}/${documentName}${extension}`,
            size: contentLength,
          },
        });
        response
          .status(HTTPStatus.OK)
          .send(file);
      });
    } catch (e) {
      response
        .status(HTTPStatus.UNAUTHORIZED)
        .send(e);
    }
  }

  private async createFolder(request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      const
        supportResourceFolder = await this.handler.readSupportResourceFolder({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          entityId: request.params.entityId,
          data: null,
        });
      const ret = await this.handler.createSupportResourceFolder({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        data: {
          name: request.body.name,
          owner: supportResourceFolder.data.userId,
          folder: {
            name: request.body.folder.name,
            parentId: supportResourceFolder.data.folder.id,
            parentPath: supportResourceFolder.data.folder.path,
          }
        },
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

  private async createLink(request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      const
        supportResourceFolder = await this.handler.readSupportResourceFolder({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          entityId: request.params.entityId,
          data: null,
        });
      const ret = await this.handler.createSupportResourceLink({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        data: {
          name: request.body.name,
          owner: supportResourceFolder.data.userId,
          externalLink: {
            name: request.body.externalLink.name,
            link: request.body.externalLink.link,
            parentId: supportResourceFolder.data.folder.id,
            parentPath: supportResourceFolder.data.folder.path,
          }
        },
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

  private async downloadSupportResource(request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      let ret = await this.handler.downloadSupportResource({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        data: {
          fileId: request.body.fileId,
          id: request.body.id
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

  private async callSupportResourceAction(request, response) {
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

  private async getFolderContent (request, response) {
    try {
      await this._sessionHandler.checkPermission({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        entityId: request.params.entityId,
        action: request.params.actionId
      });
      let ret = await this.handler.readFolderSupportResource({
        entityId: request.params.entityId,
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        data: {
          supportResourceId: request.params.supportResourceId,
          parentId: request.query.folderId,
        },
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

  private async deleteFile (request, response) {
    try {
      const
        userRootPath = await this.handler.checkUserDriveAccess({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
        });
      let ret = await this.handler.deleteFile({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        userId: userRootPath.data.id,
        data: {
          fileId: request.params.fileId,
          parentId: request.query.parentId,
        },
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

  private async deleteFolder (request, response) {
    try {
      const
        userRootPath = await this.handler.checkUserDriveAccess({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
        });
      let ret = await this.handler.deleteFolder({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        userId: userRootPath.data.id,
        data: {
          folderId: request.params.folderId,
          parentId: request.query.parentId,
        },
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

  private async deleteLink (request, response) {
    try {
      const
        userRootPath = await this.handler.checkUserDriveAccess({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
        });
      let ret = await this.handler.deleteLink({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        userId: userRootPath.data.id,
        data: {
          linkId: request.params.linkId,
          parentId: request.query.parentId,
        },
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