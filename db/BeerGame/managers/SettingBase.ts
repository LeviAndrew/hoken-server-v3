import {BasicManager} from "../../BasicManager"
import {Model} from "../model/SettingBase"

export class SettingBase extends BasicManager {
  wireCustomListeners () {}

  get model () {
    return Model;
  }

  get eventName () {
    return 'settingBase';
  }
}