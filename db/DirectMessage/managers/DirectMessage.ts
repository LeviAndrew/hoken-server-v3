import {BasicManager} from "../../BasicManager";
import {Model} from "../model/DirectMessage";

export class DirectMessage extends BasicManager {
  wireCustomListeners () {
  }

  get model () {
    return Model;
  }

  get eventName () {
    return 'directMessage';
  }
}