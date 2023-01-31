import {BasicHandler} from "../BasicHandler";
import {FindObject} from "../util/FindObject";

export class Session extends BasicHandler {

  public async checkPermission (param: permissionParam) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "action"
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const userSession = await this.sendToServer('db.session.read', new FindObject({
        findOne: true,
        query: {
          _id: param.auth,
          accessKey: param.aKey,
        },
        populate: [
          {
            path: 'mainEntities.privilege',
          }
        ]
      }));
      this.checkHubReturn(userSession.data);
      await Session.checkPrivilege({
        entityId: param.entityId,
        action: param.action,
        session: userSession.data.success.mainEntities,
      });
    } catch (e) {
      throw await this.returnHandler({
        model: 'session',
        data: {
          error: e.message || e,
        }
      });
    }
  }

  private static async checkPrivilege (param: privilegeParam) {
    for (let i = 0; i < param.session.length; i++) {
      if(param.entityId === param.session[i].entityId.toString()) {
        for (let j = 0; j < param.session[i].privilege.actions.length; j++) {
          if(param.action === param.session[i].privilege.actions[j].toString()) return;
        }
      }
      if(param.session[i].mappedChildren.length) {
        for (let a = 0; a < param.session[i].mappedChildren.length; a++) {
          if(param.session[i].mappedChildren[a].toString() === param.entityId) {
            for (let j = 0; j < param.session[i].privilege.actions.length; j++) {
              if(param.action === param.session[i].privilege.actions[j].toString()) return;
            }
          }
        }
      }
    }
    throw new Error('methodUnauthorized');
  }

}

interface defaultParam {
  entityId: string,
  action: string,
}

interface permissionParam extends defaultParam {
  auth: string,
  aKey: string,
}

interface privilegeParam extends defaultParam {
  session: [any],
}

