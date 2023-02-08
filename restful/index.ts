import {Source} from '../events/Source';
import {OpenRest} from './apis/OpenRest';
import {UserRest} from './apis/UserRest';
import {ManagementRest} from './apis/ManagementRest'
import {EhqRest} from './apis/EhqRest'
import {UploadRest} from './apis/UploadRest'
import {DownloadRest} from './apis/DownloadRest'
import {DriveRest} from './apis/DriveRest'
import {SupportResourceRest} from './apis/SupportResourceRest'
import {CollaborativeWorkRest} from './apis/CollaborativeWorkRest'
import {DirectMessageRest} from './apis/DirectMessage'
import {PlatformRest} from './apis/PlatformRest'

export class InitRestful extends Source {
  private _restfulSet: object;

  constructor (router) {
    super();
    this.restfulSet = {
      OpenRest,
      UserRest,
      ManagementRest,
      EhqRest,
      UploadRest,
      DownloadRest,
      DriveRest,
      SupportResourceRest,
      CollaborativeWorkRest,
      DirectMessageRest,
      PlatformRest,
    };
    for (let restful in this.restfulSet) {
      if(this.restfulSet.hasOwnProperty(restful)) {
        new this.restfulSet[restful](router);
      }
    }
    process.nextTick(() => {
      this.hub.send(this, 'restful.ready', {success: null, error: null});
    });
  }

  set restfulSet (restful) {
    this._restfulSet = restful;
  }

  get restfulSet () {
    return this._restfulSet;
  }
}