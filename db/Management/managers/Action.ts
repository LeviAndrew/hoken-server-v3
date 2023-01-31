import {BasicManager} from "../../BasicManager";
import {Model} from "../model/Action";

export class Action extends BasicManager {
  wireCustomListeners () {}

  get model () {
    return Model;
  }

  get eventName () {
    return 'action';
  }
}