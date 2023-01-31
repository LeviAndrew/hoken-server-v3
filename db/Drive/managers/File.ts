import {BasicManager} from "../../BasicManager";
import {Model} from "../model/File";

export class File extends BasicManager {
  wireCustomListeners () {}

  get model () {
    return Model;
  }

  get eventName () {
    return 'file';
  }
}