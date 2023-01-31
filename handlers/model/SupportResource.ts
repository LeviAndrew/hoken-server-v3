import {Drive} from "./Drive";
import {FindObject} from "../util/FindObject";
import {UpdateObject} from "../util/UpdateObject";
import * as fs from "fs";
import * as path from "path";
import {Types} from "mongoose";
import {QueryObject} from "../util/QueryObject";

export class SupportResource extends Drive {

  public async readSupportResourceFolder (param: defaultParam<null>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId"
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const userDrive = await this.getUserDrive(param.auth);
      this.checkHubReturn(userDrive.data);
      const supportResourceFolder = await this.getSupportResourceFolder({
        userId: userDrive.data.success.id,
        folders: userDrive.data.success.drive.root.folders,
      });
      return await this.returnHandler({
        model: 'supportResource',
        data: {
          success: {
            userId: userDrive.data.success.id,
            folder: supportResourceFolder,
          }
        },
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async readFolderBySupportResourceId (param: defaultParam<readFolderContent>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "supportResourceId"
      ]
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let ret;
      const user = await this.getUserIdByAuth(param.auth);
      const supportResource = await this.sendToServer('db.supportResource.read', new FindObject({
        findOne: true,
        query: {
          owner: user,
          _id: param.data.supportResourceId,
        },
        select: 'folder',
        populate: [
          {
            path: 'folder',
          }
        ]
      }));
      this.checkHubReturn(supportResource.data);
      ret = {success: supportResource.data.success.folder.path, id: supportResource.data.success.folder.id};
      if(!supportResource.data.success.folder) throw new Error('invalidSupportResource');
      return await this.returnHandler({
        model: 'supportResource',
        data: {
          success: {
            userId: user,
            folder: ret,
          }
        },
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async createSupportResourceLocalFile (param: defaultParam<createSupportResourceLocalFile>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "owner", "fileId"
      ],
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const supportResourceRet = await this.createSupportResource({
        name: param.data.name,
        resource: {
          file: param.data.fileId,
        },
        entityId: param.entityId,
        owner: param.data.owner,
        initDate: param.data.initDate,
        endDate: param.data.endDate,
        visibility: param.data.visibility,
      });
      return await this.returnHandler({
        model: 'supportResource',
        data: supportResourceRet.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async createSupportResourceFolder (param: defaultParam<createSupportResourceFolder>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "name", "folder",
        [
          "name", "parentId", "parentPath"
        ]
      ],
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const folder = await this.createDBDriveFolder({
        name: param.data.folder.name,
        parentId: param.data.folder.parentId,
        userId: param.data.owner,
        parentPath: param.data.folder.parentPath,
      });
      this.checkHubReturn(folder.data);
      const supportResourceRet = await this.createSupportResource({
        owner: param.data.owner,
        name: param.data.name,
        resource: {
          folder: folder.data.success[0].id
        },
        entityId: param.entityId,
        endDate: param.data.endDate,
        initDate: param.data.initDate,
        visibility: param.data.visibility,
      });
      return await this.returnHandler({
        model: 'supportResource',
        data: supportResourceRet.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async createSupportResourceLink (param: defaultParam<createSupportResourceLink>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "name", "externalLink",
        [
          "name", "link", "parentId", "parentPath"
        ]
      ],
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const link = await this.createDBDriveLink({
        name: param.data.externalLink.name,
        link: param.data.externalLink.link,
        parentId: param.data.externalLink.parentId,
        userId: param.data.owner,
        parentPath: param.data.externalLink.parentPath,
      });
      this.checkHubReturn(link.data);
      const supportResourceRet = await this.createSupportResource({
        owner: param.data.owner,
        name: param.data.name,
        resource: {
          externalLink: link.data.success[0].id
        },
        entityId: param.entityId,
        endDate: param.data.endDate,
        initDate: param.data.initDate,
        visibility: param.data.visibility,
      });
      return await this.returnHandler({
        model: 'supportResource',
        data: supportResourceRet.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async createChildrenFolder (param: defaultParam<supportResourceChildren>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "parentId", "folder",
        [
          "name"
        ]
      ],
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const folderParent = await this.sendToServer('db.folder.read', new FindObject({
          query: param.data.parentId,
          select: 'owner path',
        }));
      this.checkHubReturn(folderParent.data);
      const folder = await this.createDBDriveFolder({
        name: param.data.folder.name,
        parentId: param.data.parentId,
        userId: folderParent.data.success.owner,
        parentPath: folderParent.data.success.path,
      });
      this.checkHubReturn(folder.data);
      return await this.returnHandler({
        model: 'supportResource',
        data: folder.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async createChildrenLink (param: defaultParam<supportResourceChildrenLink>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "parentId", "externalLink",
        [
          "name", "link"
        ]
      ],
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const folderParent = await this.sendToServer('db.folder.read', new FindObject({
          query: param.data.parentId,
          select: 'owner path',
        }));
      this.checkHubReturn(folderParent.data);
      const link = await this.createDBDriveLink({
        name: param.data.externalLink.name,
        link: param.data.externalLink.link,
        parentId: param.data.parentId,
        userId: folderParent.data.success.owner,
        parentPath: folderParent.data.success.path,
      });
      this.checkHubReturn(link.data);
      return await this.returnHandler({
        model: 'supportResource',
        data: link.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async linkFileDrive (param: defaultParam<linkFileDrive>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "name", "fileId",
      ],
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const user = await this.sendToServer('db.user.read', new FindObject({
        findOne: true,
        query: {
          authenticationKey: param.auth,
        },
        select: 'id',
      }));
      this.checkHubReturn(user.data);
      const supportResourceRet = await this.createSupportResource({
        visibility: param.data.visibility,
        initDate: param.data.initDate,
        endDate: param.data.endDate,
        entityId: param.entityId,
        resource: {
          file: param.data.fileId,
        },
        name: param.data.name,
        owner: user.data.success.id,
      });
      return await this.returnHandler({
        model: 'supportResource',
        data: supportResourceRet.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async linkFolderDrive (param: defaultParam<linkFolderDrive>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "name", "folderId",
      ],
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const user = await this.sendToServer('db.user.read', new FindObject({
        findOne: true,
        query: {
          authenticationKey: param.auth,
        },
        select: 'id',
      }));
      this.checkHubReturn(user.data);
      const supportResourceRet = await this.createSupportResource({
        visibility: param.data.visibility,
        initDate: param.data.initDate,
        endDate: param.data.endDate,
        entityId: param.entityId,
        resource: {
          folder: param.data.folderId,
        },
        name: param.data.name,
        owner: user.data.success.id,
      });
      return await this.returnHandler({
        model: 'supportResource',
        data: supportResourceRet.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async linkFromDrive (param: defaultParam<linkFromDrive>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "name", "linkId",
      ],
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const user = await this.sendToServer('db.user.read', new FindObject({
        findOne: true,
        query: {
          authenticationKey: param.auth,
        },
        select: 'id',
      }));
      this.checkHubReturn(user.data);
      const supportResourceRet = await this.createSupportResource({
        visibility: param.data.visibility,
        initDate: param.data.initDate,
        endDate: param.data.endDate,
        entityId: param.entityId,
        resource: {
          externalLink: param.data.linkId,
        },
        name: param.data.name,
        owner: user.data.success.id,
      });
      return await this.returnHandler({
        model: 'supportResource',
        data: supportResourceRet.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async readSupportResource (param: defaultParam<null>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId",
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        currentTime = new Date().getTime(),
        initDate = {$lte: currentTime},
        endDate = {$gte: currentTime},
        supportResources = await this.sendToServer('db.supportResource.read', new FindObject({
          ...{
            query: {
              entityId: param.entityId,
              visibility: true,
              $or: [
                {
                  $and: [
                    {
                      initDate,
                      endDate,
                    }
                  ]
                },
                {
                  $and: [
                    {
                      initDate: {$exists: false},
                      endDate
                    }
                  ]
                },
                {
                  $and: [
                    {
                      initDate,
                      endDate: {$exists: false},
                    }
                  ]
                },
                {
                  $and: [
                    {
                      initDate: {$exists: false},
                      endDate: {$exists: false},
                    }
                  ]
                }
              ]
            },
          },
          ...SupportResource.getReadSupportResourceSelectPopulate(),
        }));
      return await this.returnHandler({
        model: 'supportResource',
        data: supportResources.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async readFolderSupportResource(param: defaultParam<readFolderContent>) {
    let required = this.attributeValidator([
      "auth", "aKey", "data",
      [
        "supportResourceId",
      ],
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let ret;
      if (!param.data.parentId) {
        const folderMA = await this.sendToServer('db.supportResource.read', new FindObject({
          query: param.data.supportResourceId,
          select: 'folder id name',
          populate: [
            {
              path: 'folder',
              select: 'name date _id child',
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
            },
            {
              path: 'file',
              select: 'name date extension size _id'
            },
            {
              path: 'externalLink',
              select: 'name link date _id'
            }
          ]
        }));
        this.checkHubReturn(folderMA.data);
        ret = folderMA.data.success;
      } else {
        const folderContent = await this.sendToServer('db.folder.read', new FindObject({
          query: param.data.parentId,
          select: 'child id name',
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
        ret = folderContent.data.success;
      }
      return this.returnHandler({
        model: 'supportResource',
        data: {success: ret},
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async readMySupportResource (param: defaultParam<null>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId",
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const user = await this.sendToServer('db.user.read', new FindObject({
        findOne: true,
        query: {
          authenticationKey: param.auth,
        },
        select: 'id'
      }));
      this.checkHubReturn(user.data);
      const
        supportResources = await this.sendToServer('db.supportResource.read', new FindObject({
          ...{
            query: {
              entityId: param.entityId,
              owner: user.data.success.id,
            },
            ...SupportResource.getReadSupportResourceSelectPopulate(),
          }
        }));
      return await this.returnHandler({
        model: 'supportResource',
        data: supportResources.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async updateSupportResource (param: defaultParam<updateSupportResource>) { // remover
    const permittedUpdate = [
      "name", "initDate", "endDate", "visibility"
    ];
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "id", "update", "$or",
        permittedUpdate
      ]
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        user = await this.sendToServer('db.user.read', new FindObject({
          findOne: true,
          query: {
            authenticationKey: param.auth
          },
          select: 'id',
        }));
      this.checkHubReturn(user.data);
      const updatedSupportResource = await this.sendToServer('db.supportResource.update', new UpdateObject({
        options: {
          updateOne: true,
        },
        query: {
          _id: param.data.id,
          owner: user.data.success.id,
        },
        update: this.getUpdateObject(permittedUpdate, param.data.update),
      }));
      this.checkHubReturn(updatedSupportResource.data);
      const supportResource = await this.sendToServer('db.supportResource.read', new FindObject({
        query: param.data.id,
        select: 'name initDate endDate visibility externalLink id'
      }));
      return await this.returnHandler({
        model: 'supportResource',
        data: supportResource.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async deleteSupportResource (param: defaultParam<{ id: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "id"
      ]
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        user = await this.sendToServer('db.user.read', new FindObject({
          findOne: true,
          query: {
            authenticationKey: param.auth
          },
          select: 'id',
        }));
      this.checkHubReturn(user.data);
      const mySupportResource = await this.sendToServer('db.supportResource.read', new FindObject({
        findOne: true,
        query: {
          _id: param.data.id,
          owner: user.data.success.id,
        },
        select: 'id'
      }));
      this.checkHubReturn(mySupportResource.data);
      if(!mySupportResource.data.success.id) throw new Error('invalidId');
      const deletedSupportResource = await this.sendToServer('db.supportResource.delete', new QueryObject({
        query: mySupportResource.data.success.id,
      }));
      this.checkHubReturn(deletedSupportResource.data);
      const entity = await this.sendToServer('db.entity.update', new UpdateObject({
        query: param.entityId,
        update: {
          $pull: {
            supportResources: mySupportResource.data.success.id,
          }
        }
      }));
      this.checkHubReturn(entity.data);
      return await this.returnHandler({
        model: 'supportResource',
        data: {
          success: {removed: true,}
        },
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  public async downloadSupportResource (param: defaultParam<{ fileId: string, id: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "fileId"
      ]
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        promises = await Promise.all([
          this.sendToServer('db.supportResource.read', new FindObject({
            query: param.data.id,
            select: 'id visibility initDate endDate folder file name',
          })),
          this.sendToServer('db.file.read', new FindObject({
            query: param.data.fileId,
            select: 'name extension path'
          })),
        ]);
      promises.forEach(promise => {
        this.checkHubReturn(promise.data);
      });
      this.checkIsOpenSupportResource(promises[0].data.success);
      let ret = {
        extension: promises[1].data.success.extension,
        path: promises[1].data.success.path,
        name: '',
      };
      if(promises[0].data.success.file) ret.name = promises[0].data.success.name;
      else ret.name = `${promises[0].data.success.name} - ${promises[1].data.success.name}`;
      return await this.returnHandler({
        model: 'supportResource',
        data: {
          success: ret,
        },
      })
        ;
    } catch (e) {
      return await this.returnHandler({
        model: 'supportResource',
        data: {error: e.message || e},
      });
    }
  }

  private checkIsOpenSupportResource (param: supportResourceReadRet) {
    try {
      if(!param.file && !param.folder) throw new Error('invalidSupportResource');
      if(!param.visibility) throw new Error('supportResourceClose');
      if(param.endDate || param.initDate) {
        const currentTime = new Date().getTime();
        if(
          param.endDate && param.initDate &&
          (param.initDate > currentTime || param.endDate < currentTime)
        ) throw new Error('supportResourceClose');
        if(param.initDate && param.initDate > currentTime) throw new Error('supportResourceClose');
        if(param.endDate && param.endDate < currentTime) throw new Error('supportResourceClosed');
      }
    } catch (e) {
      throw new Error(e);
    }
  }

  private static getReadSupportResourceSelectPopulate () {
    return {
      select: "name id folder file externalLink",
      populate: [
        {
          path: 'folder',
          select: 'name id child',
          populate: [
            {
              path: 'child.folders',
              select: 'name id'
            },
            {
              path: 'child.files',
              select: 'name extension size id'
            },
            {
              path: 'child.externalLinks',
              select: 'name link id'
            }
          ]
        },
        {
          path: 'file',
          select: 'name extension size id'
        },
        {
          path: 'externalLink',
          select: 'name link id'
        }
      ]
    };
  }

  private async createSupportResource (param: supportResource) {
    let required = this.attributeValidator([
      "name", "entityId", "owner", "resource", "$or",
      [
        "file", "folder", "externalLink"
      ]
    ], param);
    if(!required.success) throw new Error(required.error);
    try {
      const supportResourceRet = await this.sendToServer('db.supportResource.create', {
        name: param.name,
        entityId: param.entityId,
        owner: param.owner,
        initDate: param.initDate,
        endDate: param.endDate,
        visibility: param.visibility,
        file: param.resource.file,
        folder: param.resource.folder,
        externalLink: param.resource.externalLink,
      });
      this.checkHubReturn(supportResourceRet.data);
      const entityUpdate = await this.sendToServer('db.entity.update', new UpdateObject({
        query: param.entityId,
        update: {
          $addToSet: {
            supportResources: supportResourceRet.data.success[0].id,
          }
        }
      }));
      this.checkHubReturn(entityUpdate.data);
      return supportResourceRet;
    } catch (e) {
      throw new Error(e);
    }
  }

  private async getSupportResourceFolder (userFolders: userRootFolders) {
    try {
      const
        foldersMap = new Map(
          userFolders.folders.map(folder => {
            return [folder.name, folder];
          })
        ),
        supportResourceName = `Material de apoio ${userFolders.userId}`;
      let supportResourceFolder: any = foldersMap.get(supportResourceName);
      if(!supportResourceFolder) {
        supportResourceFolder = await this.createUserSupportResource({
          userId: userFolders.userId,
        });
      }
      return supportResourceFolder;
    } catch (e) {
      throw new Error(e);
    }
  }

  private async createUserSupportResource (param: { userId: string }) {
    try {
      const
        supportResourceFolderId = new Types.ObjectId().toString(),
        pathBase = `${process.env.DRIVE_PATH}/${param.userId}`,
        supportResourceFolder = await this.sendToServer('db.folder.create', {
          owner: param.userId,
          name: `Material de apoio ${param.userId}`,
          path: path.resolve(`${pathBase}/${supportResourceFolderId}`),
          date: new Date().getTime(),
          _id: supportResourceFolderId,
        });
      this.checkHubReturn(supportResourceFolder.data);
      this.createUserSupportResourceSOFolder({
        userId: param.userId,
        supportResourceFolderId
      });
      const user = await this.sendToServer('db.user.update', new UpdateObject({
        query: param.userId,
        update: {
          $addToSet: {
            'drive.root.folders': supportResourceFolderId,
          }
        },
        select: ['id', '_id', 'drive.root'],
        populate: [
          {
            path: 'drive.root.folders',
            select: 'name path id _id'
          }
        ]
      }));
      this.checkHubReturn(user.data);
      return supportResourceFolder.data.success[0];
    } catch (e) {
      throw new Error(e);
    }
  }

  private async createUserDrive (userId: string) {
    const supportResourceFolderId = new Types.ObjectId().toString();
    try {
      Drive.createUserRoot(userId);
      const
        pathBase = `${process.env.DRIVE_PATH}/${userId}`,
        supportResourceFolder = await this.sendToServer('db.folder.create', {
          owner: userId,
          name: `Material de apoio ${userId}`,
          path: path.resolve(`${pathBase}/${supportResourceFolderId}`),
          date: new Date().getTime(),
          _id: supportResourceFolderId,
        });
      this.checkHubReturn(supportResourceFolder.data);
      this.createUserSupportResourceSOFolder({
        userId,
        supportResourceFolderId,
      });
      const user = await this.sendToServer('db.user.update', new UpdateObject({
        query: userId,
        update: {
          drive: {
            hasRoot: true,
            root: {
              folders: [supportResourceFolderId],
            }
          }
        },
        select: ['id', '_id', 'drive.root'],
        populate: [
          {
            path: 'drive.root.folders',
            select: 'name path id _id'
          }
        ]
      }));
      this.checkHubReturn(user.data);
      return user;
    } catch (e) {
      await this.sendToServer('db.folder.delete', new FindObject({
        query: supportResourceFolderId,
      }));
      throw new Error(e);
    }
  }

  private createUserSupportResourceSOFolder (param: { userId: string, supportResourceFolderId: string }) {
    try {
      const pathBase = `${process.env.DRIVE_PATH}/${param.userId}/${param.supportResourceFolderId}`;
      if(fs.existsSync(path.resolve(pathBase))) return;
      fs.mkdirSync(path.resolve(pathBase));
    } catch (e) {
      throw new Error(e);
    }
  }

  private async getUserDrive (authenticationKey) {
    try {
      let user = await this.sendToServer('db.user.read', new FindObject({
        findOne: true,
        query: {
          authenticationKey,
        },
        select: 'drive id _id',
        populate: [
          {
            path: 'drive.root.folders',
            select: 'name path id _id'
          }
        ]
      }));
      this.checkHubReturn(user.data);
      if(!user.data.success.drive ||
        !user.data.success.drive.hasRoot) user = await this.createUserDrive(user.data.success.id);
      return user;
    } catch (e) {
      throw new Error(e);
    }
  }

}

export default new SupportResource();

interface defaultParam<T> {
  auth: string,
  aKey: string,
  entityId: string,
  data: T,
}

interface driveFolder {
  _id: string,
  id: string,
  name: string,
  path: string,
}

interface userRootFolders {
  userId: string,
  folders: driveFolder[],
}

interface supportResourceChildren {
  folder: {
    name: string,
  },
  parentId: string,
}

interface supportResourceChildrenLink {
  externalLink: {
    name: string,
    link: string,
  },
  parentId: string,
}

interface supportResourceBase {
  name: string,
  owner: string,
  initDate?: number,
  endDate?: number,
  visibility?: boolean,
}

interface supportResource extends supportResourceBase {
  resource: {
    file?: string,
    folder?: string,
    externalLink?: string,
  },
  entityId: string,
}

interface createSupportResourceLocalFile extends supportResourceBase {
  fileId: string,
}

interface createSupportResourceLocalExternalLink extends supportResourceBase {
  externalLink: string,
}

interface supportResourceFolder {
  name: string,
  parentId: string,
  parentPath: string,
}

interface supportResourceLink {
  name: string,
  link: string,
  parentId: string,
  parentPath: string,
}

interface createSupportResourceFolder extends supportResourceBase {
  folder: supportResourceFolder,
}

interface createSupportResourceLink extends supportResourceBase {
  externalLink: supportResourceLink,
}

interface linkFromDriveBase {
  name: string,
  initDate?: number,
  endDate?: number,
  visibility?: boolean,
}

interface linkFileDrive extends linkFromDriveBase {
  fileId: string,
}

interface linkFolderDrive extends linkFromDriveBase {
  folderId: string,
}

interface linkFromDrive extends linkFromDriveBase {
  linkId: string,
}

interface updateSupportResource {
  id: string,
  update: {
    name?: string,
    initDate?: number,
    endDate?: number,
    visibility?: boolean,
  }
}

interface supportResourceReadRet {
  visibility: boolean,
  initDate?: number,
  endDate?: number,
  file?: string,
  folder?: string,
  id: string,
}

interface readFolderContent {
  supportResourceId: string,
  parentId?: string,
}