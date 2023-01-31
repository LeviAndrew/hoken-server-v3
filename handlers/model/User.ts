import {BasicHandler} from "../BasicHandler";
import {FindObject} from "../util/FindObject";
import {UpdateObject} from "../util/UpdateObject";
import {Types} from "mongoose";

export class User extends BasicHandler {

  public async logout (param: logoutParam) {
    let required = this.attributeValidator(['auth', "aKey"], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let ret = await this.sendToServer('accessSession.removeKey', {
        authenticationKey: param.auth,
        accessKey: param.aKey,
      });
      return await this.returnHandler({
        model: 'user',
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      })
    }
  }

  public async updatePassword (param: changePassword) {
    let required = this.attributeValidator([
      'auth', 'currentPassword', 'newPassword'
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let userId: string = await this.getUserIdByAuth(param.auth);
      let checkPassword = await this.sendToServer('db.user.verifyPassword', {
        password: param.currentPassword,
        userId
      });
      if(!checkPassword.data.success || checkPassword.data.error) return await this.returnHandler({
        model: 'user',
        data: {error: 'invalidPassword'}
      });
      let ret = await this.sendToServer('db.user.update', new UpdateObject({
        query: userId,
        update: {
          password: param.newPassword,
        },
      }));
      let data = {success: null, error: null};
      if(!ret.data.success || ret.data.error) data.error = 'weCantUpdatePassword';
      else data.success = !!ret.data.success;
      return await this.returnHandler({
        model: 'user',
        data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async entitiesRead (param: defaultParam) {
    let required = this.attributeValidator([
      'auth'
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const userEntitiesRet = await Promise.all([
        this.sendToServer('db.user.aggregate', [
          {$match: {authenticationKey: param.auth}},
          {$project: {entities: 1}},
          {
            $lookup: {
              from: "entities",
              localField: "entities.entity",
              foreignField: "_id",
              as: "entities"
            }
          },
          {$unwind: "$entities"},
          {$replaceRoot: {newRoot: "$entities"}},
          {$match: {$and: [{visible: true}, {removed: false}]}},
          {$project:{_id: 1, id: 1, name: 1, children: 1, firstName: 1}},
        ]),
        this.sendToServer('db.user.read', new FindObject({
          findOne: true,
          query: {
            authenticationKey: param.auth,
          },
          select: 'entities',
          populate: [
            {
              path: 'entities.privileges',
              select: '_id id actions label',
              populate: [
                {
                  path: 'actions',
                  select: '_id id methods label name'
                }
              ]
            }
          ]
        })),
      ]);
      for (let i = 0; i < userEntitiesRet.length; i++) {
        this.checkHubReturn(userEntitiesRet[i].data);
      }
      const userEntitiesMap = new Map(userEntitiesRet[0].data.success.map(entity => [entity.id, entity]));
      let ret = [];
      let mainEntities = [];
      for (let i = 0; i < userEntitiesRet[1].data.success.entities.length; i++) {
        if(userEntitiesMap.has(userEntitiesRet[1].data.success.entities[i].entity.toString())) {
          ret.push({
            // @ts-ignore
            ...userEntitiesMap.get(userEntitiesRet[1].data.success.entities[i].entity.toString()),
            ...{privileges: userEntitiesRet[1].data.success.entities[i].privileges},
          });
          mainEntities.push({
            privilege: userEntitiesRet[1].data.success.entities[i].privileges.id,
            entityId: userEntitiesRet[1].data.success.entities[i].entity.toString(),
          });
        }
      }
      const updateSession = await this.sendToServer('db.session.update', new UpdateObject({
        query: param.auth,
        update: {
          mainEntities
        }
      }));
      this.checkHubReturn(updateSession.data);
      return await this.returnHandler({
        model: 'user',
        data: {success: ret},
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async entityChildrenRead (param: entityChildren) {
    let required = this.attributeValidator([
      'auth', 'entityId'
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const entityChildrenRet = await Promise.all([
        this.sendToServer('db.entity.aggregate', [
          // @ts-ignore
          {$match: {_id: new Types.ObjectId(param.entityId)}},
          {$project: {children: 1}},
          {
            $lookup: {
              from: "entities",
              localField: "children",
              foreignField: "_id",
              as: "children"
            }
          },
          {$unwind: "$children"},
          {$replaceRoot: {newRoot: "$children"}},
          {$match: {$and: [{visible: true}, {removed: false}]}},
          {$project: {_id: 1, id: 1, name: 1, children: 1, firstName: 1}},
        ]),
        this.sendToServer('db.session.read', new FindObject({
          query: param.auth,
        })),
      ]);
      for (let i = 0; i < entityChildrenRet.length; i++) {
        this.checkHubReturn(entityChildrenRet[i].data);
      }
      let mainEntitiesMap = new Map();

      for (let i = 0; i < entityChildrenRet[1].data.success.mainEntities.length; i++) {
        mainEntitiesMap.set(entityChildrenRet[1].data.success.mainEntities[i].entityId.toString(),
          new Set(entityChildrenRet[1].data.success.mainEntities[i].mappedChildren.map(childId => childId.toString()))
        )
      }
      if(mainEntitiesMap.has(param.entityId)) {
        for (let i = 0; i < entityChildrenRet[0].data.success.length; i++) {
          mainEntitiesMap.get(param.entityId).add(entityChildrenRet[0].data.success[i].id);
        }
      } else {
        for (let [entity, children] of mainEntitiesMap.entries()) {
          if(children.has(param.entityId)) {
            for (let i = 0; i < entityChildrenRet[0].data.success.length; i++) {
              mainEntitiesMap.get(entity).add(entityChildrenRet[0].data.success[i].id);
            }
          }
        }
      }
      let toUpdate = [];
      for (let i = 0; i < entityChildrenRet[1].data.success.mainEntities.length; i++) {
        toUpdate.push({
          privilege: entityChildrenRet[1].data.success.mainEntities[i].privilege,
          entityId: entityChildrenRet[1].data.success.mainEntities[i].entityId,
          mappedChildren: [...mainEntitiesMap.get(entityChildrenRet[1].data.success.mainEntities[i].entityId.toString())],
        })
      }
      const sessionUpdate = await this.sendToServer('db.session.update', new UpdateObject({
        query: param.auth,
        update: {
          mainEntities: toUpdate,
        }
      }));
      this.checkHubReturn(sessionUpdate.data);
      return await this.returnHandler({
        model: 'user',
        data: entityChildrenRet[0].data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

}

export default new User();

interface defaultParam {
  auth: string,
}

interface logoutParam extends defaultParam {
  aKey: string,
}

interface changePassword extends defaultParam {
  currentPassword: string,
  newPassword: string,
}

interface entityChildren extends defaultParam {
  entityId: string,
}