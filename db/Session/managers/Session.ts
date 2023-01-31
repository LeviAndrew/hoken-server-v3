import {BasicManager} from "../../BasicManager";
import {Model} from "../model/Session";

export class Session extends BasicManager {
  wireCustomListeners () {}

  get model () {
    return Model;
  }

  get eventName () {
    return 'session';
  }
}