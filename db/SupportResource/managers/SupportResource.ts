import {BasicManager} from "../../BasicManager";
import {Model} from "../model/SupportResource";

export class SupportResource extends BasicManager {
  wireCustomListeners () {
  }

  get model () {
    return Model;
  }

  get eventName () {
    return 'supportResource';
  }
}