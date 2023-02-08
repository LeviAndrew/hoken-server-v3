import {BasicHandler} from "../BasicHandler";
import {FindObject} from "../util/FindObject";
import {Promise} from "mongoose";
import {Application} from "../../Application";
import {UpdateObject} from "../util/UpdateObject";

export class Platform extends BasicHandler {

    public async register(param: defaultParam<register>) {
      const
        model = 'user',
        required = this.attributeValidator([
          "pKey", "data", [
            "id", "educationalInstitution",
          ]
        ], param);
      if (!required.success) return await this.getErrorAttributeRequired(required.error);
      try {
        const apiSetting = (await this.sendToServer('db.apiSetting.read', new FindObject({
            findOne: true,
            query: {
              apiKey: param.pKey
            }
          }))).data.success;
        if (!apiSetting) return await this.returnHandler({
          model,
          data: {error: 'invalidApiSetting'}
        });
        const ret = await this.sendToServer('db.user.update', new UpdateObject({
            query: param.data.id,
            update: {
                platformKey: apiSetting.apiKey,
                educationalInstitution: param.data.educationalInstitution
            },
            select: ['userType', 'id', 'name', 'surname', 'email', 'educationalInstitution', 'platformKey'],
          }));
        this.checkHubReturn(ret.data);
        return await this.returnHandler({
          model,
          data: ret.data,
        });
      } catch (e) {
        return await this.returnHandler({
          model,
          data: {error: e.message || e},
        })
      }
    }

}

export default new Platform();

interface defaultParam<T> {
  pKey: string,
  userId?: string,
  data: T
}

interface register {
  id: string,
  educationalInstitution: string,
}