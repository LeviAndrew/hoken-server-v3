import {Drive} from "../../handlers/model/Drive";
import {Session} from '../../handlers/authentication/Session'
import Handler from "../../handlers/model/Drive";
import * as HTTPStatus from 'http-status-codes';
import * as path from "path"
import {BasicMulterRest} from "../BasicMulterRest";
import {Types} from 'mongoose'

export class DriveRest extends BasicMulterRest {
  // @ts-ignore
  protected _handler: Drive;
  protected _sessionHandler: Session;

  constructor (router) {
    super(router, Handler);
    this._sessionHandler = new Session();
    this.routes = {
      post: {
        '/drive/folder': this.createFolder.bind(this),
        '/drive/file/:name': this.createFile.bind(this),
        '/drive/link': this.createLink.bind(this),
      },
      get: {
        '/drive/folder': this.getFolderContent.bind(this),
        '/drive/file/:fileId': this.downloadFile.bind(this),
        '/drive/link': this.getLinkContent.bind(this),
      },
      put: {
        '/drive/file/rename': this.updateFileName.bind(this),
        '/drive/folder/rename': this.updateFolderName.bind(this),
        '/drive/link': this.updateLink.bind(this),
      },
      delete: {
        '/drive/file/:fileId' : this.deleteFile.bind(this),
        '/drive/folder/:folderId' : this.deleteFolder.bind(this),
        '/drive/link/:linkId' : this.deleteLink.bind(this),
      }
    };

    this.wiring();
  }

  set handler (value: Drive) {
    this._handler = value;
  }

  get handler (): Drive {
    return this._handler;
  }

  set routes (rotas) {
    this._routes = rotas;
  }

  get routes () {
    return this._routes;
  }

  private async createFolder (request, response) {
    try {
      const
        userRootPath = await this.handler.checkUserDriveAccess({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
        });
      let ret = await this.handler.createFolder({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        userId: userRootPath.data.id,
        data: {
          name: request.body.name,
          parentId: request.body.parentId,
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

  private async createFile (request, response) {
    try {
      const
        userRootPath = await this.handler.checkUserDriveAccess({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
        });
      let dest = await this.handler.getFolderPath({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        userId: userRootPath.data.id,
        data: {
          parentId: request.query.parentId,
        },
      });
      if(!dest.success) return response.status(HTTPStatus.OK).send(dest);
      const
        documentName = new Types.ObjectId().toString(),
        originalName = request.params.name.substring(0, request.params.name.lastIndexOf('.')),
        extension = path.extname(request.params.name),
        contentLength = request.headers['content-length'],
        acceptedTypes = require(path.resolve('config.json')).drive.acceptedTypes;
      await this.handler.checkExistFile({
        userId: userRootPath.data.id,
        parentId: request.query.parentId,
        name: originalName,
        extension: extension,
      });
      this.configureSingleMulter({
        acceptedTypes,
        fieldName: "driveFile",
        dest: dest.data,
        documentName,
      })(request, response, async error => {
        if(error) {
          const message = error.message ? error.message : 'uploadFile';
          return response
            .status(HTTPStatus.OK)
            .send({success: false, data: message});
        }
        const ret = await this.handler.createFile({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
          userId: userRootPath.data.id,
          data: {
            fileId: documentName,
            parentId: request.query.parentId,
            extension,
            name: originalName,
            path: `${dest.data}/${documentName}${extension}`,
            size: contentLength,
          },
        });
        response
          .status(HTTPStatus.OK)
          .send(ret);
      });
    } catch (e) {
      response
        .status(HTTPStatus.OK)
        .send(e);
    }
  }

  private async createLink (request, response) {
    try {
      const
        userRootPath = await this.handler.checkUserDriveAccess({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
        });
      let dest = await this.handler.getFolderPath({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        userId: userRootPath.data.id,
        data: {
          parentId: request.body.parentId,
        },
      });
      if(!dest.success) return response.status(HTTPStatus.OK).send(dest);
      let ret = await this.handler.createLink({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        userId: userRootPath.data.id,
        data: {
          name: request.body.name,
          link: request.body.link,
          path: dest.data,
          parentId: request.body.parentId,
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

  private async getFolderContent (request, response) {
    try {
      const
        userRootPath = await this.handler.checkUserDriveAccess({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
        });
      let ret = await this.handler.getFolderContent({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        userId: userRootPath.data.id,
        data: {
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

  private async getLinkContent (request, response) {
    try {
      const
        userRootPath = await this.handler.checkUserDriveAccess({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
        });
      let ret = await this.handler.getLinkContent({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        userId: userRootPath.data.id,
        data: {
          linkId: request.body.linkId,
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

  private async downloadFile (request, response) {
    try {
      const
        userRootPath = await this.handler.checkUserDriveAccess({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
        });
      let ret = await this.handler.downloadFile({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        userId: userRootPath.data.id,
        data: {
          fileId: request.params.fileId,
        },
      });
      if(!ret.success) return response.status(HTTPStatus.OK).send(ret);
      response
        .status(HTTPStatus.OK)
        .download(path.resolve(ret.data.path), `${ret.data.name}${ret.data.extension}`);
    } catch (e) {
      response
        .status(HTTPStatus.UNAUTHORIZED)
        .send(e);
    }
  }

  private async updateFileName (request, response) {
    try {
      const
        userRootPath = await this.handler.checkUserDriveAccess({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
        });
      let ret = await this.handler.updateFileName({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        userId: userRootPath.data.id,
        data: {
          id: request.body.fileId,
          newName: request.body.newName
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

  private async updateFolderName (request, response) {
    try {
      const
        userRootPath = await this.handler.checkUserDriveAccess({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
        });
      let ret = await this.handler.updateFolderName({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        userId: userRootPath.data.id,
        data: {
          id: request.body.folderId,
          newName: request.body.newName
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

  private async updateLink (request, response) {
    try {
      const
        userRootPath = await this.handler.checkUserDriveAccess({
          auth: request.headers['authentication-key'],
          aKey: request.headers['access-key'],
        });
      let ret = await this.handler.updateLink({
        auth: request.headers['authentication-key'],
        aKey: request.headers['access-key'],
        userId: userRootPath.data.id,
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

interface multerParam {
  dest: string,
  documentName: string,
  fieldName: string,
  acceptedTypes: string[]
}