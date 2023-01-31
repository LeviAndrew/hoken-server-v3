import {BasicManager} from "../../BasicManager";
import {Model} from "../model/Folder";

export class Folder extends BasicManager {
  wireCustomListeners () {
  }

  get model () {
    return Model;
  }

  get eventName () {
    return 'folder';
  }
}