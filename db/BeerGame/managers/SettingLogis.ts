import {BasicManager} from "../../BasicManager"
import {Model} from "../model/SettingLogis"

export class SettingLogis extends BasicManager {
  wireCustomListeners () {}

  get model () {
    return Model;
  }

  get eventName () {
    return 'settingLogis';
  }
}