import {BasicManager} from "../../BasicManager";
import {Model} from "../model/ExternalLink";

export class ExternalLink extends BasicManager {
  wireCustomListeners () {
  }

  get model () {
    return Model;
  }

  get eventName () {
    return 'externalLink';
  }
}