import {BasicManager} from "../../BasicManager";
import {Model} from "../model/Test";

export class Test extends BasicManager {
  wireCustomListeners () {}

  get model () {
    return Model;
  }

  get eventName () {
    return 'test';
  }
}