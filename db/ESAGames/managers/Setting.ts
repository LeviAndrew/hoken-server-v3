import {BasicManager} from "../../BasicManager"
import {Model} from "../model/Setting"

export class Setting extends BasicManager {
  wireCustomListeners () {}

  get model () {
    return Model;
  }

  get eventName () {
    return 'setting';
  }
}