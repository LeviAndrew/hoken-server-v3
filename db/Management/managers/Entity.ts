import {BasicManager} from "../../BasicManager";
import {Model} from "../model/Entity";

export class Entity extends BasicManager {
  wireCustomListeners () {}

  get model () {
    return Model;
  }

  get eventName () {
    return 'entity';
  }
}