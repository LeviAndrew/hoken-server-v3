import {BasicHandler} from "../BasicHandler";
import {FindObject} from "../util/FindObject";

export class BarrierHandler extends BasicHandler {

  async checkLoggedUser(data){
    let ret = await this.sendToServer('accessSession.isValid', data);
    if(ret.data.error) return {
      success: false,
      data: 'accessDenied'
    };
    return {
      success: true,
      data: true,
    };
  };

  async checkPkey(pKey) {
    const
      ret = await this.sendToServer('db.apiSetting.read', new FindObject({
        query: {
          apiKey: pKey,
        },
      }));
    if (ret.data.error) return {
      success: false,
      data: 'accessDenied'
    };
    return {
      success: true,
      data: true,
    };
  };

}