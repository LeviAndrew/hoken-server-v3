import {BasicManager} from "../../BasicManager";
import {Model} from "../model/Module";

export class Module extends BasicManager {
  wireCustomListeners () {}

  get model () {
    return Model;
  }

  get eventName () {
    return 'module';
  }
}