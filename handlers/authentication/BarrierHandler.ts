import {BasicHandler} from "../BasicHandler";

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

}