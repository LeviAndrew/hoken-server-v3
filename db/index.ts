import {ManagerMap} from "../interfaces/ManagerMap";
import {
  User,
  Entity,
  Action,
  Privilege,
  Module,
} from './Management'
import {
  Session
} from './Session'
import {
  File,
  Folder,
  ExternalLink
} from './Drive'
import {
  SupportResource
} from './SupportResource'
import {
  CollaborativeWork,
  CollaborativeWorkAnswer
} from './CollaborativeWork'
import {
  Test,
  TestApplication
} from './Ehq'
import {
  DirectMessage
} from './DirectMessage'
import {
  APISetting,
  Setting
} from './BeerGame'
/**
 * Inicia todos os managers.
 */
let Managers: ManagerMap = {
  user: new User(),
  action: new Action(),
  entity: new Entity(),
  module: new Module(),
  privilege: new Privilege(),
  session: new Session(),
  file: new File(),
  folder: new Folder(),
  externalLink: new ExternalLink(),
  supportResource: new SupportResource(),
  collaborativeWork: new CollaborativeWork(),
  collaborativeWorkAnswer: new CollaborativeWorkAnswer(),
  Test: new Test(),
  TestApplication: new TestApplication(),
  directMessage: new DirectMessage(),
  apiSetting: new APISetting(),
  setting: new Setting(),
};

export {Managers};