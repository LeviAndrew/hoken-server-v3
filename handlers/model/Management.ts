import {BasicHandler} from "../BasicHandler";
import {FindObject} from "../util/FindObject";
import {UpdateObject} from "../util/UpdateObject";
import {QueryObject} from "../util/QueryObject";

export class Management extends BasicHandler {

  public async moduleRead(param: defaultParam<null>) {
    let required = this.attributeValidator([
      "auth", "aKey", "data"
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const modulesRet = await this.sendToServer('db.module.read', new FindObject({
        query: {},
        select: 'label actions id _id',
        populate: [
          {
            path: 'actions',
            select: 'label name methods'
          }
        ]
      }));
      return await this.returnHandler({
        model: 'module',
        data: modulesRet.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'module',
        data: {error: e.message || e},
      });
    }
  }

  public async privilegeCreate(param: defaultParam<moduleCreate>) {
    let required = this.attributeValidator([
      "auth", "aKey", "data", [
        "label", "actions"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const privilegeRet = await this.sendToServer('db.privilege.create', {
        label: param.data.label,
        actions: param.data.actions,
      });
      return await this.returnHandler({
        model: 'privilege',
        data: privilegeRet.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'privilege',
        data: {error: e.message || e},
      });
    }
  }

  public async privilegesRead(param: defaultParam<null>) {
    let required = this.attributeValidator([
      "auth", "aKey", "data"
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const privilegesRet = await this.sendToServer('db.privilege.read', new FindObject({
        query: {},
        select: 'actions label id _id',
        populate: [
          {
            path: 'actions',
            select: 'label name id _id'
          }
        ]
      }));
      return await this.returnHandler({
        model: 'privilege',
        data: privilegesRet.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'privilege',
        data: {error: e.message || e},
      });
    }
  }

  public async privilegeUpdate(param: defaultParam<privilegeUpdate>) {
    let required = this.attributeValidator([
      "auth", "aKey", "data", [
        "id", "update", "$or", ["label", "actions"]
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let update = {};
      if (param.data.update.label) update['label'] = param.data.update.label;
      if (param.data.update.actions) update['actions'] = await this.getValidActions(param.data.update.actions);
      const privilegesRet = await this.sendToServer('db.privilege.update', new UpdateObject({
        query: param.data.id,
        update,
        select: ['actions', 'id', '_id', 'label'],
      }));
      return await this.returnHandler({
        model: 'privilege',
        data: privilegesRet.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'privilege',
        data: {error: e.message || e},
      });
    }
  }

  public async entityCreate(param: defaultParam<entityCreate>) {
    let required = this.attributeValidator([
      "auth", "aKey", "data", [
        "parentsId", "name"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      if (param.data.initialDate || param.data.endDate) this.checkDate({
        endDate: param.data.endDate,
        initialDate: param.data.initialDate,
      });
      const managementModuleRet = await this.sendToServer('db.module.read', new FindObject({
        findOne: true,
        query: {
          name: "management",
        },
        select: 'id'
      }));
      this.checkHubReturn(managementModuleRet.data);
      let modules = [managementModuleRet.data.success.id];
      if (param.data.modules) modules = modules.concat(param.data.modules);
      const entityRet = await this.sendToServer('db.entity.create', {
        name: param.data.name,
        parents: param.data.parentsId,
        modules,
        firstName: param.data.firstName || '',
        visible: !!param.data.visible,
        activate: !param.data.initialDate,
        initialDate: param.data.initialDate || null,
        endDate: param.data.endDate || null,
      });
      if (entityRet.data.error || !entityRet.data.success) throw new Error('weCantCreateEntity');
      const parentUpdateRet = await this.addChildren({
        entityId: entityRet.data.success[0].id,
        to: param.data.parentsId
      });
      if (!parentUpdateRet.data.success || parentUpdateRet.data.error) {
        await this.sendToServer('db.entity.delete', new FindObject({
          query: entityRet.data.success[0].id,
        }));
        throw new Error('weCantSetParent');
      }
      return await this.returnHandler({
        model: 'entity',
        data: entityRet.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'entity',
        data: {error: e.message || e},
      });
    }
  }

  public async entityUpdate(param: defaultParam<entityUpdate>) {
    const allowedAttr = ["name", "firstName", "visible", "activate", "initialDate", "endDate"];
    let required = this.attributeValidator([
      "auth", "aKey", "data",
      [
        "id", "update", "$or",
        allowedAttr,
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      if (param.data.update.initialDate) this.handleInitialDate(param.data.update);
      if (param.data.update.endDate) await this.handleEndDate(param.data);
      //Todo: checar se o usuario tem permissão para atualizar essa entidade
      const entityRet = await this.sendToServer('db.entity.update', new UpdateObject({
        query: param.data.id,
        update: this.getUpdateObject(allowedAttr, param.data.update),
        select: [...allowedAttr, "id", "_id"]
      }));
      return await this.returnHandler({
        model: 'entity',
        data: entityRet.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'entity',
        data: {error: e.message || e},
      });
    }
  }

  public async entityAddOn(param: defaultParam<addEntity>) {
    let required = this.attributeValidator([
      "auth", "aKey", "data",
      [
        "entityId", "to"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const toSet = new Set(param.data.to);
      if (toSet.has(param.data.entityId)) throw new Error('entityCantBeSelfParent');
      const entityRet = await Promise.all([
        this.addChildren({
          entityId: param.data.entityId,
          to: param.data.to
        }),
        this.addParent({parents: param.data.to, child: param.data.entityId}),
      ]);
      for (let i = 0; i < entityRet.length; i++) {
        this.checkHubReturn(entityRet[i].data);
      }
      return await this.returnHandler({
        model: 'entity',
        data: entityRet[1].data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'entity',
        data: {error: e.message || e},
      });
    }
  }

  public async removeEntityFrom(param: defaultParam<removeEntity>) {
    const
      model = 'entity',
      required = this.attributeValidator([
        "auth", "aKey", "data",
        [
          "entitiesId", "from"
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        entities = await this.sendToServer('db.entity.read', new FindObject({
          query: {
            _id: {
              $in: param.data.entitiesId,
            }
          },
          select: 'id parents name',
        }));
      this.checkHubReturn(entities.data);
      for (let i = 0; i < entities.data.success.length; i++) {
        if (!entities.data.success[i].parents || entities.data.success[i].parents.length < 2) return await this.returnHandler({
          model,
          data: {error: `cantRemoveParentEntity-${entities.data.success[i]}`},
        });
      }
      const
        entityRet = await Promise.all([
          this.removeChildren(param.data),
          this.removeParent(param.data),
        ]);
      for (let i = 0; i < entityRet.length; i++) {
        this.checkHubReturn(entityRet[i].data);
      }
      return await this.returnHandler({
        model,
        data: entityRet[0].data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async entityReadPerPage(param: defaultParam<pagination>) {
    let required = this.attributeValidator([
      "auth", "aKey", "data",
      [
        "page", "skip"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        entitiesId = await this.readEntityTree([param.data.entityId]),
        query = {
          _id: {
            $in: [...entitiesId],
          }
        },
        promises = await Promise.all([
          this.sendToServer('db.entity.count', new FindObject({query,})),
          this.sendToServer('db.entity.read', new FindObject({
            query,
            select: 'visible name firstName parents initialDate endDate id',
            populate: [{
              path: "parents",
              select: "id name firstName"
            }],
            pagination: {
              limit: param.data.skip,
              nextPage: param.data.page,
            },
            orderBy: {
              asc: ['name'],
              desc: [],
            }
          })),
        ]);
      promises.forEach(promise => {
        this.checkHubReturn(promise.data);
      });
      return await this.returnHandler({
        model: 'entity',
        data: {
          success: {
            count: promises[0].data.success,
            entities: promises[1].data.success,
          }
        },
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'entity',
        data: {error: e.message || e},
      });
    }
  }

  public async userCreate(param: defaultParam<userCreate>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "name", "surname", "email", "password", "matriculation", "document", "entities"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      await this.userValidate({entityId: param.entityId, user: param.data});
      const newUser = await this.sendToServer('db.user.create', param.data);
      this.checkHubReturn(newUser.data);
      const entities = await this.sendToServer('db.entity.update', new UpdateObject({
        query: {
          _id: {
            $in: param.data.entities.map(entity => entity.entity),
          }
        },
        update: {
          $addToSet: {
            users: newUser.data.success[0].id,
          }
        },
        options: {
          multi: true,
        }
      }));
      this.checkHubReturn(entities.data);
      return await this.returnHandler({
        model: 'user',
        data: newUser.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async userReadByFilter(param: defaultParam<userReadFilter>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "filterType", "data"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let query;
      if (param.data.filterType === 'name') {
        query = {
          $or: [
            {
              name: {
                $regex: `.*${param.data.data}.*`,
                $options: 'si',
              },
            },
            {
              surname: {
                $regex: `.*${param.data.data}.*`,
                $options: 'si',
              },
            }
          ]
        }
      }
      if (param.data.filterType === "document") {
        query = {
          ['document.documentNumber']: param.data.data,
        };
      }
      if (param.data.filterType === 'matriculation') {
        query = {
          matriculation: param.data.data,
        };
      }
      const user = await this.sendToServer('db.user.read', new FindObject({
        query,
        select: 'name surname birthday email matriculation document id entities'
      }));
      if (!query) throw new Error('invalidFilter');
      return await this.returnHandler({
        model: 'user',
        data: user.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async userUpdate(param: defaultParam<userUpdate>) {
    const allowedAttribute = [
      "name", "surname", "birthday", "email", "password", "matriculation", "document", "educationalInstitution"
    ];
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "id", "update", "$or",
        allowedAttribute
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      await this.checkUserPermissionUpdate({
        userId: param.data.id,
        entityId: param.entityId
      });
      if (param.data.update.document) await this.userDocumentValidate(param.data.update.document);
      const user = await this.sendToServer('db.user.update', new UpdateObject({
        query: param.data.id,
        update: this.getUpdateObject(allowedAttribute, param.data.update),
        select: ["name", "surname", "birthday", "email", "matriculation", "document", "educationalInstitution"],
      }));
      return await this.returnHandler({
        model: 'user',
        data: user.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async userAddOnEntity(param: defaultParam<userAddOnEntity>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        'id', 'to', 'privileges'
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      await this.checkUserToAdd({
        userId: param.data.id,
        entityId: param.entityId,
        entityTo: param.data.to,
      });
      await this.checkExistPrivilege(param.data.privileges);
      const entitiesSet = await this.readEntityTree([param.entityId]);
      if (!entitiesSet.has(param.data.to)) throw new Error('weCantAddOnThisEntity');
      const updateEntity = await this.sendToServer('db.entity.update', new UpdateObject({
        query: param.data.to,
        update: {
          $addToSet: {
            users: param.data.id,
          }
        }
      }));
      this.checkHubReturn(updateEntity.data);
      const date = new Date().getTime();
      const user = await this.sendToServer('db.user.update', new UpdateObject({
        query: param.data.id,
        update: {
          $addToSet: {
            entities: {
              date,
              entity: param.data.to,
              privileges: param.data.privileges,
            }
          }
        },
        select: ['name', 'surname', 'birthday', 'email', 'matriculation', 'document', 'entities'],
      }));
      return await this.returnHandler({
        model: 'user',
        data: user.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async userReadEntities(param: defaultParam<{ id: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        'id'
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let user = await this.sendToServer('db.user.read', new FindObject({
        query: param.data.id,
        select: "entities id",
        populate: [
          {
            path: 'entities.entity',
            select: 'visible name firstName id activate'
          },
          {
            path: 'entities.privileges',
            select: "label id"
          }
        ],
      }));
      this.checkHubReturn(user.data);
      user.data.success.entities = user.data.success.entities.filter(userEntity => userEntity.entity.activate);
      return await this.returnHandler({
        model: 'user',
        data: user.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async readAllUser(param: defaultParam<null>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data"
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let user = await this.sendToServer('db.user.read', new FindObject({
        query: {
          removed: false,
        },
        select: " name surname email matriculation entities id",
      }));
      this.checkHubReturn(user.data);
      return await this.returnHandler({
        model: 'user',
        data: user.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async entityReadByName(param: defaultParam<{ name: string }>) {
    const
      model = "entity",
      required = this.attributeValidator([
        "auth", "aKey", "data", [
          "name"
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const entitiesTree = await this.readEntityTree([param.entityId]);
      const entityRet = await this.sendToServer('db.entity.read', new FindObject({
        query: {
          $and: [
            {
              _id: {
                $in: [...entitiesTree],
              },
            },
            {
              $or: [
                {
                  name: {
                    $regex: `.*${param.data.name}.*`,
                    $options: 'si',
                  },
                },
                {
                  firstName: {
                    $regex: `.*${param.data.name}.*`,
                    $options: 'si',
                  },
                }
              ]
            }
          ]
        },
        select: 'visible activate name firstName id _id'
      }));
      return await this.returnHandler({
        model,
        data: entityRet.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async entityReadChildren(param: defaultParam<null>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId"
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const entity = await this.sendToServer("db.entity.read", new FindObject({
        query: param.entityId,
        select: "id children",
        populate: [
          {
            path: "children",
            select: "children name id",
          }
        ]
      }))
      return await this.returnHandler({
        model: 'user',
        data: entity.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async entityReadPerId(param: defaultParam<{ id: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "data", 
      [
        'id'
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let entity = await this.sendToServer("db.entity.read", new FindObject({
        query: param.data.id,
        select: "id name visible parents children",
        populate: [
          {
            path: "children",
            select: "children name id"
          },
          {
            path: "parents",
            select: "id name"
          }
        ]
      }))
      return await this.returnHandler({
        model: 'user',
        data: entity.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async userRemoveFromEntity(param: defaultParam<removeFromEntity>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        'id', 'from'
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      await this.checkUserPermissionUpdate({
        userId: param.data.id,
        entityId: param.entityId
      });
      const tree = await this.readEntityTree([param.entityId]);
      if (!tree.has(param.data.from)) throw new Error('weCantRemoveUserFromThisEntity');
      const updateEntity = await this.sendToServer('db.entity.update', new UpdateObject({
        query: param.data.from,
        update: {
          $pull: {
            users: param.data.id,
          }
        }
      }));
      this.checkHubReturn(updateEntity.data);
      const user = await this.sendToServer('db.user.update', new UpdateObject({
        query: param.data.id,
        update: {
          $pull: {
            entities: {
              entity: param.data.from,
            }
          }
        },
        select: ["name", "surname", "birthday", "email", "matriculation", "document", "entities"],
      }));
      return await this.returnHandler({
        model: 'user',
        data: user.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async userChangePrivilege(param: defaultParam<changePrivilege>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        'id', 'entity', 'privilege'
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      await this.checkUserPermissionUpdate({
        userId: param.data.id,
        entityId: param.entityId
      });
      const tree = await this.readEntityTree([param.entityId]);
      if (!tree.has(param.data.entity)) throw new Error('weCantChangeOnThisEntity');
      const userUpdate = await this.sendToServer('db.user.update', new UpdateObject({
        query: {
          _id: param.data.id,
          "entities.entity": param.data.entity,
        },
        update: {
          "entities.$.privileges": param.data.privilege,
        },
        options: {
          updateOne: true,
        }
      }));
      this.checkHubReturn(userUpdate.data);
      const user = await this.sendToServer('db.user.read', new FindObject({
        query: param.data.id,
        select: 'id _id entities',
        populate: [
          {
            path: 'entities.entity',
            select: 'visible name firstName id activate'
          },
          {
            path: 'entities.privileges',
            select: "label id"
          }
        ],
      }));
      return await this.returnHandler({
        model: 'user',
        data: user.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async userReadPerPage(param: defaultParam<pagination>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "page", "skip"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        usersId = await this.readUsersIdByEntity([param.entityId]),
        query = {
          _id: {
            $in: [...usersId],
          }
        },
        promises = await Promise.all([
          this.sendToServer('db.user.count', new QueryObject({
            query,
          })),
          this.sendToServer('db.user.read', new FindObject({
            query,
            select: 'name surname birthday email matriculation document _id id entities',
            populate: [{
              path: "entities.privileges",
              select: 'id label'
            }],
            pagination: {
              limit: param.data.skip,
              nextPage: param.data.page,
            },
            orderBy: {
              asc: ['name', 'surname', 'email'],
              desc: [],
            }
          })),
        ]);
      promises.forEach(promise => {
        this.checkHubReturn(promise.data);
      });
      return await this.returnHandler({
        model: 'user',
        data: {
          success: {
            count: promises[0].data.success,
            users: promises[1].data.success,
          }
        },
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async userDelete(param: defaultParam<{ usersId: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "usersId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const users = await this.sendToServer('db.user.read', new FindObject({
        query: {
          _id: {
            $in: param.data.usersId,
          }
        },
        select: 'id name removed'
      }));
      this.checkHubReturn(users.data);
      if (!users.data.success.length) throw new Error('userNotFound');
      for (let i = 0; i < users.data.success.length; i++) {
        await this.sendToServer('db.user.update', new UpdateObject({
          query: users.data.success[i].id,
          update: {
            removed: true,
          },
        }));
        users.data.success[i].removed = true;
      }
      return await this.returnHandler({
        model: 'user',
        data: users.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async entityDelete(param: defaultParam<{ id: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "id"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const promisesCount = await Promise.all([
        this.sendToServer('db.user.count', new FindObject({
          query: {
            "entities.entity": param.data.id,
          },
        })),
        this.sendToServer('db.entity.count', new FindObject({
          query: {
            parents: param.data.id,
          },
        })),
        this.sendToServer('db.entity.read', new FindObject({
          query: param.data.id,
          select: 'users children',
        })),
      ]);
      for (let i = 0; i < promisesCount.length; i++) {
        if (promisesCount[i].error) throw new Error(promisesCount[i].error);
      }
      if (
        promisesCount[0].data.success ||
        promisesCount[1].data.success ||
        promisesCount[2].data.success.children.length ||
        promisesCount[2].data.success.users.length
      ) throw new Error('entityCantBeRemoved');
      const removed = await this.sendToServer('db.entity.delete', new QueryObject({
        query: param.data.id,
      }));
      this.checkHubReturn(removed.data);

      await this.sendToServer("db.entity.update", new UpdateObject({
        query: {
          children: param.data.id,
        },
        update: {
          $pull: {
            children: param.data.id,
          }
        }
      }));
      return await this.returnHandler({
        model: 'entity',
        data: {success: true},
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'entity',
        data: {error: e.message || e},
      });
    }
  }

  public async privilegeDelete(param: defaultParam<{ id: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "id"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const inUseCount = await this.sendToServer('db.user.count', new FindObject({
        query: {
          "entities.privileges": param.data.id,
        },
      }));
      if (inUseCount.data.error) throw new Error(inUseCount.data.error);
      if (inUseCount.data.success) throw new Error('thisPrivilegeIsInUse');
      const removed = await this.sendToServer('db.privilege.delete', new QueryObject({
        query: param.data.id,
      }));
      this.checkHubReturn(removed.data);
      return await this.returnHandler({
        model: 'entity',
        data: {success: true},
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'entity',
        data: {error: e.message || e},
      });
    }
  }

  private async readUsersIdByEntity(entityId: [string]) {
    const entitiesId = await this.readEntityTree(entityId);
    const usersEntities = await this.sendToServer('db.entity.read', new FindObject({
      query: {
        _id: {
          $in: [...entitiesId],
        },
        activate: true,
      },
      select: 'users',
    }));
    this.checkHubReturn(usersEntities.data);
    let ret = new Set();
    usersEntities.data.success.forEach(entity => {
      ret = new Set([...ret, ...entity.users.map(userId => {
        return userId.toString();
      })])
    });
    return ret;
  }

  private async getValidActions(param: [string]) {
    try {
      const validActions = await this.sendToServer('db.action.read', new FindObject({
        query: {
          _id: {
            $in: param,
          }
        },
        select: 'id',
      }));
      this.checkHubReturn(validActions.data);
      return validActions.data.success.map(action => action.id);
    } catch (e) {
      throw e;
    }
  }

  private checkDate(param: dateInterval) {
    console.log('implementar isso', param);
  }

  private handleInitialDate(param: entityUpdateData) {
    if (Number.isNaN(param.initialDate)) throw new Error('initialDateMustBeNumber');
    const currentDate = new Date().getTime();
    if (param.initialDate < (currentDate + 43200000)) throw new Error('initialDateMustBeGreaterThan12Hours');
    param['activate'] = false;
  }

  private async handleEndDate(param: entityUpdate) {
    if (Number.isNaN(param.update.endDate)) throw new Error('endDateMustBeNumber');
    const currentDate = new Date().getTime();
    if (param.update.endDate < (currentDate + 86400000)) throw new Error('endDateMustBeGreaterThan24Hours');
    if (param.update.initialDate) {
      this.handleInitialDate(param.update);
      if (param.update.initialDate >= param.update.endDate) throw new Error('endDateMustBeGreaterThanInitialDate');
    } else {
      const entityRet = await this.sendToServer('db.entity.read', new FindObject({
        query: param.id,
        select: 'initialDate'
      }));
      if (!entityRet.data.success || entityRet.data.error) throw new Error('invalidEntity');
      if (
        entityRet.data.success.initialDate &&
        (entityRet.data.success.initialDate >= param.update.endDate)
      ) throw new Error('endDateMustBeGreaterThanInitialDate');
    }
  }

  private addChildren(param: addEntity) {
    try {
      return this.sendToServer('db.entity.update', new UpdateObject({
        query: {
          _id: {
            $in: param.to,
          }
        },
        update: {
          $addToSet: {
            children: param.entityId,
          }
        },
        options: {
          multi: true,
        }
      }));
    } catch (e) {
      throw e;
    }
  }

  private addParent(param: addParents) {
    try {
      return this.sendToServer('db.entity.update', new UpdateObject({
        query: param.child,
        update: {
          $addToSet: {
            parents: param.parents,
          }
        },
        select: ['name', 'id', '_id', 'parents'],
      }));
    } catch (e) {
      throw e;
    }
  }

  private removeChildren(param: removeEntity) {
    try {
      return this.sendToServer('db.entity.update', new UpdateObject({
        query: param.from,
        update: {
          $pull: {
            children: {
              $in: param.entitiesId,
            }
          }
        },
        select: ['name', 'id', '_id', 'children'],
      }));
    } catch (e) {
      throw e;
    }
  }

  private removeParent(param: removeEntity) {
    try {
      return this.sendToServer('db.entity.update', new UpdateObject({
        query: {
          _id: {
            $in: param.entitiesId,
          }
        },
        update: {
          $pull: {
            parents: param.from,
          }
        },
        options: {
          multi: true,
        }
      }))
    } catch (e) {
      throw e;
    }
  }

  private async userDocumentValidate(param: document) {
    const hasUser = await this.sendToServer('db.user.count', new FindObject({
      query: {
        ["document.documentType"]: param.documentType,
        ["document.documentNumber"]: param.documentNumber,
      }
    }));
    if (hasUser.data.success) throw new Error('userAlreadyExist');
    if (hasUser.data.error) throw new Error(hasUser.data.error);
  }

  private async userValidate(param: { entityId: string, user: userCreate }) {
    this.userDocumentValidate(param.user.document);
    const entitiesTree = await this.readEntityTree([param.entityId]);
    const currentDate = new Date().getTime();
    for (let i = 0; i < param.user.entities.length; i++) {
      if (!entitiesTree.has(param.user.entities[i].entity)) throw new Error('cantSetUserOnEntity');
      param.user.entities[i].date = currentDate;
    }
  }

  private async checkUserPermissionUpdate(param: { userId: string, entityId: string }) {
    const toCheck = await Promise.all([
      this.sendToServer('db.user.read', new FindObject({
        query: param.userId,
        select: 'entities'
      })),
      this.readEntityTree([param.entityId]),
    ]);
    this.checkHubReturn(toCheck[0].data);
    for (let i = 0; i < toCheck[0].data.success.entities.length; i++) {
      if (toCheck[1].has(toCheck[0].data.success.entities[i].entity.toString())) return;
    }
    throw new Error('userCantBeUpdateFromThisEntity');
  }

  private async checkExistPrivilege(privilegeId: string) {
    const privilege = await this.sendToServer('db.privilege.count', new FindObject({
      query: privilegeId,
    }));
    this.checkHubReturn(privilege.data);
  }

  private async checkUserToAdd(param: { userId: string, entityId: string, entityTo: string }) {
    const toCheck = await Promise.all([
      this.sendToServer('db.user.read', new FindObject({
        query: param.userId,
        select: 'entities'
      })),
      this.readEntityTree([param.entityId]),
    ]);
    this.checkHubReturn(toCheck[0].data);
    for (let i = 0; i < toCheck[0].data.success.entities.length; i++) {
      if (toCheck[0].data.success.entities[i].entity.toString() === param.entityTo) throw new Error('userAlreadyIsInThisEntity');
      if (toCheck[1].has(toCheck[0].data.success.entities[i].entity.toString())) return;
    }
    // throw new Error('userCantBeUpdateFromThisEntity'); \\ comentando para gerenciar fora de UDESC
  }

}

export default new Management();

interface defaultParam<T> {
  auth: string,
  aKey: string,
  entityId: string,
  data: T,
}

interface moduleCreate {
  label: string,
  actions: [string]
}

interface privilegeUpdate {
  id: string,
  update: {
    label?: string,
    actions?: [string]
  }
}

interface dateInterval {
  initialDate?: number,
  endDate?: number,
}

interface entityCreate extends dateInterval {
  parentsId: [string],
  name: string,
  firstName?: string,
  visible?: boolean,
  modules?: [string]
}

interface entityUpdateData {
  name?: string,
  firstName?: string,
  visible?: string,
  activate?: boolean,
  initialDate?: number,
  endDate?: number,
}

interface entityUpdate {
  id: string,
  update: entityUpdateData
}

interface addEntity {
  entityId: string,
  to: [string],
}

interface removeEntity {
  from: string,
  entitiesId: [string]
}

interface addParents {
  parents: [string],
  child: string,
}

interface pagination {
  entityId: string,
  page: number,
  skip: number,
}

interface document {
  documentType: string,
  documentNumber: string,
}

interface userEntity {
  date?: number,
  entity: string,
  privileges: string,
}

interface userCreate {
  name: string,
  surname: string,
  birthday: number,
  email: string,
  password: string,
  matriculation: string,
  document: document,
  entities: [userEntity]
}

interface userReadFilter {
  filterType: "name" | "document" | "matriculation",
  data: string,
}

interface userUpdate {
  id: string,
  update: {
    name?: string,
    surname?: string,
    birthday?: number,
    email?: string,
    password?: string,
    matriculation?: string,
    document?: document,
    educationalInstitution?: string
  }
}

interface userAddOnEntity {
  id: string,
  to: string,
  privileges: string,
}

interface removeFromEntity {
  id: string,
  from: string,
}

interface changePrivilege {
  id: string,
  entity: string,
  privilege: string
}