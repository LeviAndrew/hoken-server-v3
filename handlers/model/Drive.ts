import {BasicHandler} from "../BasicHandler";
import * as fs from "fs";
import * as path from 'path'
import {FindObject} from "../util/FindObject";
import {Types} from 'mongoose'
import {UpdateObject} from "../util/UpdateObject";

export class Drive extends BasicHandler {

  public async checkUserDriveAccess(param: baseDefaultParam) {
    let required = this.attributeValidator([
      "auth"
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const userRet = await this.sendToServer('db.user.read', new FindObject({
        findOne: true,
        query: {
          authenticationKey: param.auth
        },
        select: '_id id drive.canUpdate drive.hasRoot'
      }));
      this.checkHubReturn(userRet.data);
      if (!userRet.data.success.drive.canUpdate) throw new Error('driveEnable');
      if (!userRet.data.success.drive.hasRoot) {
        Drive.createUserRoot(userRet.data.success.id);
        const updatedUser = await this.sendToServer("db.user.update", new UpdateObject({
          query: userRet.data.success.id,
          update: {
            'drive.hasRoot': true,
          }
        }));
        this.checkHubReturn(updatedUser.data);
      }
      return this.returnHandler({
        model: 'drive',
        data: userRet.data
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async createFolder(param: defaultParam<createFolder>) {
    let required = this.attributeValidator([
      "auth", "aKey", "userId", "data", ['name']
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        parentPath = await this.checkExistFolder({
          userId: param.userId,
          parentId: param.data.parentId,
          name: param.data.name,
        }),
        newFolder = await this.createDBDriveFolder({
          userId: param.userId,
          name: param.data.name,
          parentId: param.data.parentId,
          parentPath,
        });
      return this.returnHandler({
        model: 'drive',
        data: newFolder.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async createLink(param: defaultParam<createLink>) {
    let required = this.attributeValidator([
      "auth", "aKey", "userId", "data",
      [
        "link", "name", "path"
      ],
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        newLink = await this.createDBDriveLink({
          userId: param.userId,
          name: param.data.name,
          link: param.data.link,
          parentId: param.data.parentId,
          parentPath: param.data.path,
        });
      return this.returnHandler({
        model: 'drive',
        data: newLink.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async getFolderPath(param: defaultParam<readFolderContent>) {
    let required = this.attributeValidator([
      "auth", "aKey", "userId", "data"
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let ret;
      if (!param.data.parentId) ret = {success: `${process.env.DRIVE_PATH}/${param.userId}`};
      else {
        const folderRet = await this.sendToServer('db.folder.read', new FindObject({
          query: param.data.parentId,
          select: 'path'
        }));
        this.checkHubReturn(folderRet.data);
        ret = {success: folderRet.data.success.path};
      }
      return this.returnHandler({
        model: 'drive',
        data: ret,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async createFile(param: defaultParam<fileCreate>) {
    let required = this.attributeValidator([
      "auth", "aKey", "userId", "data",
      [
        "name", "path", "extension"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const createdFile = await this.sendToServer('db.file.create', {
        name: param.data.name,
        extension: param.data.extension,
        date: new Date().getTime(),
        path: param.data.path,
        owner: param.userId,
        size: param.data.size,
        _id: param.data.fileId,
      });
      this.checkHubReturn(createdFile.data);
      if (!param.data.parentId) {
        const root = await this.sendToServer('db.user.update', new UpdateObject({
          query: param.userId,
          update: {
            $addToSet: {
              'drive.root.files': createdFile.data.success[0].id,
            }
          }
        }));
        this.checkHubReturn(root.data);
      } else {
        const folder = await this.sendToServer('db.folder.update', new UpdateObject({
          query: param.data.parentId,
          update: {
            $addToSet: {
              'child.files': createdFile.data.success[0].id,
            }
          }
        }));
        this.checkHubReturn(folder.data);
      }
      return this.returnHandler({
        model: 'drive',
        data: createdFile.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async checkExistFile(param: { userId: string, parentId?: string, name: string, extension: string }) {
    try {
      let files = [];
      if (!param.parentId) {
        const rootChild = await this.sendToServer('db.user.read', new FindObject({
          query: param.userId,
          select: 'drive.root.files',
          populate: [
            {
              path: 'drive.root.files',
              select: 'name extension',
            }
          ]
        }));
        this.checkHubReturn(rootChild.data);
        if (
          rootChild.data.success.drive &&
          rootChild.data.success.drive.root &&
          rootChild.data.success.drive.root.files
        ) files = rootChild.data.success.drive.root.files;
      } else {
        const folderChild = await this.sendToServer('db.folder.read', new FindObject({
          query: param.parentId,
          select: 'child.files',
          populate: [
            {
              path: 'child.files',
              select: 'name extension'
            }
          ]
        }));
        this.checkHubReturn(folderChild.data);
        if (folderChild.data.success.child && folderChild.data.success.child.files) files = folderChild.data.success.child.files;
      }
      if (files.length) {
        // @ts-ignore
        const filesMapName = new Map(files.map(file => {
          return [file.name, file.extension]
        }));
        if (filesMapName.has(param.name) && filesMapName.get(param.name) === param.extension) throw new Error('fileAlreadyExist');
      }
      return;
    } catch (e) {
      throw await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async getFolderContent(param: defaultParam<readFolderContent>) {
    let required = this.attributeValidator([
      "auth", "aKey", "data"
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let ret;
      if (!param.data.parentId) {
        const root = await this.sendToServer('db.user.read', new FindObject({
          query: param.userId,
          select: 'drive.root',
          populate: [
            {
              path: 'drive.root.folders',
              select: 'name date'
            },
            {
              path: 'drive.root.files',
              select: 'name date size extension'
            },
            {
              path: 'drive.root.externalLinks',
              select: 'name date link'
            }
          ]
        }));
        this.checkHubReturn(root.data);
        ret = root.data.success.drive.root;
      } else {
        const folderContent = await this.sendToServer('db.folder.read', new FindObject({
          query: param.data.parentId,
          select: 'child',
          populate: [
            {
              path: 'child.folders',
              select: 'name date',
            },
            {
              path: 'child.files',
              select: 'name date size extension'
            },
            {
              path: 'child.externalLinks',
              select: 'name date link'
            }
          ]
        }));
        this.checkHubReturn(folderContent.data);
        ret = folderContent.data.success.child;
      }
      return this.returnHandler({
        model: 'drive',
        data: {success: ret},
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async getLinkContent(param: defaultParam<readLinkContent>) {
    let required = this.attributeValidator([
      "auth", "aKey", "data", ["linkId"]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let ret;
      const link = await this.sendToServer('db.externalLink.read', new FindObject({
        query: param.data.linkId,
        select: 'id name link path date removed',
      }));
      this.checkHubReturn(link.data);
      ret = link.data.success;
      return this.returnHandler({
        model: 'drive',
        data: {success: ret},
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async downloadFile(param: defaultParam<readFile>) {
    let required = this.attributeValidator([
      "auth", "aKey", "userId", "data", ["fileId"]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const fileRead = await this.sendToServer('db.file.read', new FindObject({
        query: param.data.fileId,
        select: 'name extension path'
      }));
      this.checkHubReturn(fileRead.data);
      return this.returnHandler({
        model: 'drive',
        data: fileRead.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async updateFileName(param: defaultParam<renameFile>) {
    let required = this.attributeValidator([
      "auth", "aKey", "userId", "data", ["id", "newName"]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const fileUpdated = await this.sendToServer('db.file.update', new UpdateObject({
        query: param.data.id,
        update: {
          name: param.data.newName,
        },
        select: ["id", "name", "extension"],
      }));
      return this.returnHandler({
        model: 'drive',
        data: fileUpdated.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async updateFolderName(param: defaultParam<renameFile>) {
    let required = this.attributeValidator([
      "auth", "aKey", "userId", "data", ["id", "newName"]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const folderUpdated = await this.sendToServer('db.folder.update', new UpdateObject({
        query: param.data.id,
        update: {
          name: param.data.newName,
        },
        select: ["id", "name"],
      }));
      return this.returnHandler({
        model: 'drive',
        data: folderUpdated.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async updateLink(param: defaultParam<renameLink>) {
    const allowedAttribute = [
      "name", "link"
    ];
    let required = this.attributeValidator([
      "auth", "aKey", "userId", "data",
      [
        "linkId", "update", "$or",
        allowedAttribute
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const linkUpdated = await this.sendToServer('db.externalLink.update', new UpdateObject({
        query: param.data.linkId,
        update: this.getUpdateObject(allowedAttribute, param.data.update),
        select: ["id", "name", "link"],
      }));
      return this.returnHandler({
        model: 'drive',
        data: linkUpdated.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async deleteFile(param: defaultParam<readFile>) {
    let required = this.attributeValidator([
      "auth", "aKey", "userId", "data", ["fileId"]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const ret = await this.sendToServer('db.file.update', new UpdateObject({
        query: param.data.fileId,
        update: {
          removed: true,
        },
        select: ["id", "removed"],
      }));
      this.checkHubReturn(ret.data);
      if(!param.data.parentId){
        const user = await this.sendToServer('db.user.update', new UpdateObject({
        query: param.userId,
        update: {
          $pull: {
            "drive.root.files": param.data.fileId,
          },
        },
      }))}      
      else {
        const parent = await this.sendToServer('db.folder.update', new UpdateObject({
          query: param.data.parentId,
          update: {
            $pull: {
              "child.files": param.data.fileId,
            }
          }
        }))
      }
      await this.unlinkDoc(param.data.fileId, 'file')
      return this.returnHandler({
        model: 'drive',
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async deleteFolder(param: defaultParam<readFolder>) {
    let required = this.attributeValidator([
      "auth", "aKey", "userId", "data", ["folderId"]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const ret = await this.sendToServer('db.folder.update', new UpdateObject({
        query: param.data.folderId,
        update: {
          removed: true,
        },
        select: ["id", "removed"],
      }));
      this.checkHubReturn(ret.data);
      if(!param.data.parentId) {
        const user = await this.sendToServer('db.user.update', new UpdateObject({
        query: param.userId,
        update: {
          $pull: {
            "drive.root.folders": param.data.folderId,
          },
        },
      }))}
      else {
        const parent = await this.sendToServer('db.folder.update', new UpdateObject({
          query: param.data.parentId,
          update: {
            $pull: {
              "child.folders": param.data.folderId,
            }
          }
        }))
      }
      this.unlinkDoc(param.data.folderId, 'folder')
      return this.returnHandler({
        model: 'drive',
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  public async deleteLink(param: defaultParam<readLinkContent>) {
    let required = this.attributeValidator([
      "auth", "aKey", "userId", "data", ["linkId"]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const ret = await this.sendToServer('db.externalLink.update', new UpdateObject({
        query: param.data.linkId,
        update: {
          removed: true,
        },
        select: ["id", "removed"],
      }));
      this.checkHubReturn(ret.data);
      if(!param.data.parentId) {
        const user = await this.sendToServer('db.user.update', new UpdateObject({
        query: param.userId,
        update: {
          $pull: {
            "drive.root.externalLinks": param.data.linkId,
          },
        },
      }))}
      else {
        const parent = await this.sendToServer('db.folder.update', new UpdateObject({
          query: param.data.parentId,
          update: {
            $pull: {
              "child.externalLinks": param.data.linkId,
            }
          }
        }))
      }
      this.unlinkDoc(param.data.linkId, 'externalLink')
      return this.returnHandler({
        model: 'drive',
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'drive',
        data: {error: e.message || e},
      });
    }
  }

  private async unlinkDoc(dockerId: string, docType: string) {
    const doc = await this.sendToServer(`db.${docType}.read`, new FindObject({
      query: dockerId,
      select: 'id path'
    }))
    if(!doc.data.success || doc.data.error) throw 'cantRemoveRealDoc';
    if(docType === 'file') fs.unlinkSync(path.resolve(doc.data.success.path))
    else if(docType === 'folder') fs.rmdirSync(path.resolve(doc.data.success.path))
    else if(docType === 'externalLink') fs.rmdirSync(path.resolve(doc.data.success.path))
  }

  private async checkExistFolder(param: { userId: string, parentId?: string, name: string }) {
    try {
      let folders = [];
      let pathToRet = null;
      if (param.parentId) {
        const folderParent = await this.sendToServer('db.folder.read', new FindObject({
          query: param.parentId,
          select: 'child.folders path',
          populate: [
            {
              path: 'child.folders',
              select: 'name',
            }
          ]
        }));
        this.checkHubReturn(folderParent.data);
        if (folderParent.data.success.child && folderParent.data.success.child.folders && folderParent.data.success.child.folders.length) {
          folders = [...folderParent.data.success.child.folders];
        }
        pathToRet = folderParent.data.success.path;
      } else {
        const userDrive = await this.sendToServer('db.user.read', new FindObject({
          query: param.userId,
          select: 'drive.root.folders',
          populate: [
            {
              path: 'drive.root.folders',
              select: 'name'
            }
          ]
        }));
        this.checkHubReturn(userDrive.data);
        if (userDrive.data.success.drive &&
          userDrive.data.success.drive.root &&
          userDrive.data.success.drive.root.folders.length) {
          folders = [...userDrive.data.success.drive.root.folders];
        }
        pathToRet = `${process.env.DRIVE_PATH}/${param.userId}`;
      }
      this.checkExistsFolderOnFolderArray(folders, param.name);
      return pathToRet;
    } catch (e) {
      throw new Error(e);
    }
  }

  private checkExistsFolderOnFolderArray(folders: any[], name: string) {
    for (let folder of folders) {
      if (folder.name === name) throw new Error('folderAlreadyExistsInThisPath');
    }
  }

  protected static createUserRoot(userId: string) {
    try {
      const pathBase = `${process.env.DRIVE_PATH}/${userId}`;
      if (fs.existsSync(path.resolve(pathBase))) return;
      fs.mkdirSync(path.resolve(pathBase));
    } catch (e) {
      throw new Error(e);
    }
  }

  protected async createDBDriveFolder(param: createDbFolder) {
    try {
      const
        newFolderId = new Types.ObjectId(),
        newFolder = await this.sendToServer('db.folder.create', {
          owner: param.userId,
          name: param.name,
          date: new Date().getTime(),
          _id: newFolderId,
          path: `${param.parentPath}/${newFolderId}`
        });
      this.checkHubReturn(newFolder.data);
      if (param.parentId) {
        const folderUpdate = await this.sendToServer('db.folder.update', new UpdateObject({
          query: param.parentId,
          update: {
            $addToSet: {
              'child.folders': newFolder.data.success[0].id,
            }
          }
        }));
        this.checkHubReturn(folderUpdate.data);
      } else {
        const userRootUpdate = await this.sendToServer('db.user.update', new UpdateObject({
          query: param.userId,
          update: {
            $addToSet: {
              'drive.root.folders': newFolder.data.success[0].id,
            }
          }
        }));
        this.checkHubReturn(userRootUpdate.data);
      }
      fs.mkdirSync(path.resolve(newFolder.data.success[0].path));
      return newFolder;
    } catch (e) {
      throw new Error(e);
    }
  }

  protected async createDBDriveLink(param: createDbLink) {
    try {
      const
        newLinkId = new Types.ObjectId(),
        newLink = await this.sendToServer('db.externalLink.create', {
          owner: param.userId,
          name: param.name,
          link: param.link,
          date: new Date().getTime(),
          _id: newLinkId,
          path: `${param.parentPath}/${newLinkId}`
        });
      this.checkHubReturn(newLink.data);
      if (param.parentId) {
        const linkUpdate = await this.sendToServer('db.folder.update', new UpdateObject({
          query: param.parentId,
          update: {
            $addToSet: {
              'child.externalLinks': newLink.data.success[0].id,
            }
          }
        }));
        this.checkHubReturn(linkUpdate.data);
      } else {
        const userRootUpdate = await this.sendToServer('db.user.update', new UpdateObject({
          query: param.userId,
          update: {
            $addToSet: {
              'drive.root.externalLinks': newLink.data.success[0].id,
            }
          }
        }));
        this.checkHubReturn(userRootUpdate.data);
      }
      fs.mkdirSync(path.resolve(newLink.data.success[0].path));
      return newLink;
    } catch (e) {
      throw new Error(e);
    }
  }

}

export default new Drive();

interface baseDefaultParam {
  auth: string,
  aKey: string,
}

interface defaultParam<T> extends baseDefaultParam {
  userId: string,
  data?: T,
}

interface readFolderContent {
  parentId?: string,
}

interface readLinkContent {
  linkId: string,
  parentId?: string,
}

interface readFile {
  fileId: string,
  parentId?: string,
}

interface readFolder {
  folderId: string,
  parentId?: string,
}

interface createFolder extends readFolderContent {
  name: string,
}

interface createLink extends readFolderContent {
  name: string,
  link: string,
  path: string,
  parentId?: string,
}

interface fileCreate extends readFolderContent {
  fileId: string,
  name: string,
  path: string,
  size?: number,
  extension: string,
}

interface renameFile {
  id: string,
  newName: string,
}

interface renameLink {
  linkId: string,
  update: {
    newName?: string,
    newLink?: string,
  }  
}

interface createDbFolder {
  userId: string,
  name: string,
  parentPath: string,
  parentId?: string
}

interface createDbLink {
  userId: string,
  name: string,
  link: string,
  parentPath: string,
  parentId?: string
}