import {BasicManager} from "../../BasicManager";
import {Model} from "../model/Privilege";

export class Privilege extends BasicManager {
  wireCustomListeners () {}

  get model () {
    return Model;
  }

  get eventName () {
    return 'privilege';
  }
}