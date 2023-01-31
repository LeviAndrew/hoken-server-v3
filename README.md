    # backend-template-koalla by Principia™

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?)](https://bitbucket.org/xundas/backendtemplate/commits/all)
[![Bitbucket license](://img.shields.io/github/license/thiagobrez/react-native-template-pro.svg)](https://bitbucket.org/xundas/backendtemplate/src/master/LICENSE)

![Usage demo](link)

Our dear backend template with a friendly folder structure, database, async rtc and rest support plus automated tests. 

### :bookmark_tabs: Requirements

---

* npm [properly installed](https://www.npmjs.com/get-npm)
* MongoDB [properly installed](https://docs.mongodb.com/manual/installation/)
* TypeScript@3.6.3 [properly installed](https://www.typescriptlang.org/index.html#download-links)
* Node.js@10.12.0 (or higher) [properly installed](https://nodejs.org/en/download/package-manager/)
* Knowledge on [Mocha Test Framework](https://mochajs.org/)
* Knowledge on [RTC(Socket-io)](https://en.wikipedia.org/wiki/Socket.IO) or [REST](https://en.wikipedia.org/wiki/Representational_state_transfer)(Express.js)
* Knowledge on Non-Relational Database



### :arrow_forward: Installation

---

`git clone https://bitbucket.org/principiamvp/backendtemplate.git`

`cd backendtemplate`

`npm install` then `tsc`

### :package: Folder Structure

* **authentication: here is the classes responsible for authentication and security**
* **db: contains all mongo's db managers, it's models and schemas. This is where you define your 
        database properties**
        
* **events: here we have all classes related to connection through events: Message class with it`s interface
        plus a Hub, Hub is where all events come across plus all event's listeners**
        
* **handler: singleton classes containing the application's logic**

* **interfaces: here remains all used interfaces**

* **locale: all locales are here, separated by languages' sub-directories**

* **resources: all resource files are here, as example for images**

* **restful: this is were our rest classes are, these classes are used to make services requisitions**

* **rtc: real time connection`s classes that are used to turn the server reactive**

* **test: here is the environment for testing, it contains mocha.opts, a TestManager`s interface and 
        subdirectories, where remains the fixtures to populate our db, restful and rtc classed that uses mocha+chai.**
        
* **util: all classes with multi-utility remains here alogn with pub/priv keys. It's main class is the static Util.ts**

---

### :package: What's included

---

* **Friendly Folder structure**
* [MongoDB](https://www.mongodb.com/): non-relational databae
* [Typescript](https://www.typescriptlang.org/): typing for safer use of JavaScript
* [Node.js](https://nodejs.org/en/): runtime environment for server-side application
* [Express.js](http://expressjs.com/): web application framework


### :beginner: Roadmap to development

Our template was thought and defined to be best used alongside [Test Driven Development](http://agiledata.org/essays/tdd.html) methodology. But nothing prevents to be used alongside another methodology

#### RTC development:
- After defined user's permission case, create mocha-chai testfile and as first test, create a socket-io, simulating a browser-server connection

```javascript
import {TestManager} from '../TestManager';

const config = require(path.resolve('devConfig.json'));

const chai = require("chai");
const chaihttp = require("chai-http");
chai.use(chaihttp);
let expect = chai.expect;
let io = require("socket.io-client");
let socketUrl = `http://localhost:${config.server.port}`;
let testManager = null;

describe("Test AdminRTC", () => {
  before((done) => {
    testManager = new TestManager(done);
  });

  let client = null;
  let userAdmin = null;

  it("CONNECT", (done) => {
    client = io(socketUrl);
    client.on("connect", (data) => {
      done();
    });
    client.connect();
  });
```

- Create test based on the system`s functionality and emit through the socket-io it's functionality's event
```javascript
...
describe('User', () => {
it('Login test', (done) => {
    let response = (msg) => {
        expect(msg.datas.success).to.be.true;
        expect(msg.datas.data).to.be.instanceOf(Object);
        expect(msg.datas.data).to.have.all.keys('pro1', 'prop2', 'prop3');
        //todo expects ...
        
        client.removeListener('response', response);
        done(); 
    };
    let data = {
        email: value,
        password: value2,
        otherParamYouMayNeed: valueYouMayNeed
    };
    client.emit('loginEventName', {request: data});
};
...
});
...
```

- Add functionality's event to it's RTC.interfaceListener and bind it to it's asynchronous function

```typescript
import {BasicRTC} from './BasicRTC';
import {OpenHandler} from model;
import Handler from model;
import {AdminRTC} from './RTCs/AdminRTC';
import {CommonRTC} from './RTCs/CommonRTC';

export class OpenRTC extends BasicRTC {
  protected _userRTCs: BasicRTC;

  constructor(conf) {
    super('login', Handler, conf);
    this.userRTCs = {
      'admin': AdminRTC,
      'common': CommonRTC,
    };
    this.interfaceListeners = {
      'login': this.login.bind(this),
      'otherEventsItMayListen': this.otherFunctionItMayHave.bind(this),
    };
    this.wiring(); // connects it's listener to it's function
  }
  ...
  
  async login(msg) {
      msg.response = await this.handler.login(msg.request);
      if (msg.response.success) {
        return this.changeRTC(msg);
      }
      this.sendToBrowser(msg);
    }
```
- Implement all logic at it's handler.

```typescript
import {BasicHandler} from "../BasicHandler";
import {FindObject} from '../util/FindObject';
import {Application} from '../../Application';

export class OpenHandler extends BasicHandler {

  public async login(data: { login: string, password: string }): Promise<{ success: boolean, data: any }> {
    let required = this.attributeValidator(['login', 'password'], data);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    let ret = await this.sendToServer('db.user.login', {
      password: data.password,
      queryObject: new FindObject({
        query: {
          email: data.login,
          removed: false,
        },
        select: 'id name surname email logged password',
      }),
      select: ['id','type','name','surname','email'],
    });
    return await this.returnHandler({
      model: 'user',
      data: ret.data,
    });
  }
```

#### REST development:

- After defined user's permission case, create mocha-chai testfile for Rest testing and use chai functions to simulate a rest requisition
######hint: here a good practice is to separate each functionality and it's success/failure using describe
```typescript
import * as path from 'path';
import {TestManager} from '../TestManager';

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
let testManager = null;
const baseURL = `http://localhost:${config.server.port}`;

describe('Test OpenRest', () => {

  before((done) => {
    testManager = new TestManager(done);
  });

  describe("LOCALE", ()=>{

    describe("Success", ()=>{

      it("Get", (done) => {
        chai.request(baseURL)
          .get('/api/locale')
          .query({i18n: 'pt-Br'})
          .end(async (error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success","data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Object);
            done();
          });
      });
```

- Add rest's route requisition to it's Rest class and bind it to a asynchronous function to requisite handler's function
```typescript
import {BasicRest} from "../BasicRest";
import {OpenHandler} from "../../handlers/user/OpenHandler";
import Handler from "../../handlers/user/OpenHandler";
import * as HTTPStatus from 'http-status-codes';

export class OpenRest extends BasicRest {
  protected _handler: OpenHandler;

  constructor(router) {
    super(router, Handler);

    this.routes = {
      get:{
        '/locale': this.getLocale.bind(this),
        '/other/serviceRoute/itMayHave': this.otherFunctionItMayHave.bind(this),
      },
    };
    ...
    ...
    private async getLocale(req, res){
        let response = await this.handler.getLocale(req.query);
        res
          .status(HTTPStatus.OK)
          .send(response);
      }
```

- Implement all logic in it`s handler (same step as RTC development)

```typescript
import {BasicHandler} from "../BasicHandler";
import {FindObject} from '../util/FindObject';
import {Application} from '../../Application';
import * as path from 'path';

export class OpenHandler extends BasicHandler {
    public async getLocale(data){
        let dataLocale = Application.getPathI18N();
        let i18n = data.i18n ? data.i18n : dataLocale.defaultI18N;
        let ret = await this.getI18N({path: path.resolve(`${dataLocale.mainPath}/${i18n}/${dataLocale.i18n}`)});
        return await this.returnHandler({
          model: 'global',
          data: ret
        });
      }
}
```

### :pushpin: Roadmap

---

- [x] Create integrated boilerplate for development with restful and/or rtc preprared connections
- [ ] Prepare Docker for application deployment
- [ ] Script to run with test files to generate a documentation based on it's mocha-chai.expects

### :warning: Known issues

---
* **Mocha-chai testing not being used as the best it can** - Since we are not interested in expects strictly matching our return event (we just use the main idea, as example: to be an array, to have some keys etc...)

### :pencil2: Contributing

---

This template was first designed by Osvaldo Miguel and has been enhanced over time by our backend team and now we gladly have first released it . Feel free to submit any issues, questions or PR's!
 
At Principia we use this template as base for every server side development we do and we hope it makes your path best.

### :clipboard: License

---

[MIT](https://bitbucket.org/xundas/backendtemplate/src/master/LICENSE)