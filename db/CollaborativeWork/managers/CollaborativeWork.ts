import {BasicManager} from "../../BasicManager";
import {Model} from "../model/CollaborativeWork";

export class CollaborativeWork extends BasicManager {
  wireCustomListeners () {
  }

  get model () {
    return Model;
  }

  get eventName () {
    return 'collaborativeWork';
  }
}