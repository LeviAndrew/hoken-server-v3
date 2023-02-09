import {BasicManager} from "../../BasicManager"
import {Model} from "../model/APISetting"

export class APISetting extends BasicManager {
  wireCustomListeners () {}

  get model () {
    return Model;
  }

  get eventName () {
    return 'apiSetting';
  }
}