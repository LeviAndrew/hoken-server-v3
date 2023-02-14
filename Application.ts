require('dotenv').config();
import * as SocketIO from "socket.io";
import * as Express from "express";
import * as Path from "path";
import * as HTTP from "http";
import * as HTTPS from "https";
import * as CORS from 'cors'
import * as RedirectHttps from "redirect-https";
import * as BodyParser from "body-parser";
import * as j2x from 'json2xls'
import * as zip from 'express-easy-zip'
import {Barrier} from "./authentication/Barrier";
import {InitRestful} from "./restful";
import {Source} from "./events/Source";
import {Database} from "./db/Database";
import {OpenRTC} from "./rtc/OpenRTC";
import {Greenlock} from "./util/Greenlock";
import {Router} from "express";
import {AccessController} from './session/AccessController'
import {GameController} from './game_beergame/GameController'
import {GameBaseController} from './game_base/GameController'
import {TestsSessionController} from './session/TestsSessionController';
import {MailSender} from './mail/MailSender'
import * as fs from "fs";

const peer = require('peer');

export class Application extends Source {
  private _mailSender: MailSender
  private _accessController: AccessController;
  private _gameController: GameController;
  private _gameBaseController: GameBaseController;
  private _testsSessionController: TestsSessionController;
  private _mainPort: any;
  private _dataBase: any;
  private _server: any;
  private _router: any;
  private static _config: any;
  private _app: any;
  private _io: any;
  private expressPeerServer: any;

  constructor(pathConfig) {
    super();
    Application.config = pathConfig;
    this.app = Express;
    this.server = this.initServer();
    this.expressPeerServer = peer.ExpressPeerServer;
    this.serverConfiguration();
    this.initIO();
    this.router = Router;
    // this.accessController = AccessController;
    this.testsSessionController = TestsSessionController;
    this.server.listen(this.mainPort, this.initDataBase.bind(this));
    this.createPaths();
    this.mailSender = MailSender
  }

  private set testsSessionController(testsSessionController) {
    this._testsSessionController = new testsSessionController({
      minutesLimit: Application.config.test.minutesLimit,
      io: SocketIO(this.server, {path: '/testEnter'})
    });
  }

  private set accessController(accessController) {
    this._accessController = new accessController();
  }

  private set gameController(gameController) {
    this._gameController = new gameController();
  }

  private set gameBaseController(gameBaseController) {
    this._gameBaseController = new gameBaseController();
  }

  private set mailSender(mailSender) {
    this._mailSender = new mailSender()
  }

  private set mainPort(port) {
    this._mainPort = port;
  }

  private get mainPort() {
    return this._mainPort;
  }

  private set dataBase(dataBase) {
    this._dataBase = new dataBase(Application.config.db);
  }

  private get dataBase() {
    return this._dataBase;
  }

  private set server(server) {
    this._server = server;
  }

  private get server() {
    return this._server;
  }

  private set router(router) {
    this._router = new router();
  }

  private get router() {
    return this._router;
  }

  private static set config(pathConfig) {
    Application._config = require(pathConfig);
  }

  private static get config() {
    return Application._config;
  }

  public static get initialPlayed(){
    return Application._config.initialPlayed;
  }

  private set app(express) {
    this._app = express();
  }

  private get app() {
    return this._app;
  }

  private set io(io) {
    this._io = io;
  }

  private get io() {
    return this._io;
  }

  /**
   * Liga os eventos que o application precisa ouvir.
   */
  private wiring() {
    this.hub.on('error.**', this.initError.bind(this));
    this.hub.on('database.ready', this.dataBaseReady.bind(this));
    this.hub.on('restful.ready', this.serverOk.bind(this));
  }

  private initError(error) {
    return console.error(`Something is wrong ${error}`);
  }

  /**
   * É executada assim que o server fica pronto para atender.
   */
  private serverOk() {
    this.app.use('/api', this.router);
    this.hub.send(this, 'app.ready', {success: null, error: null});
    console.log(`APP EM DEV. VAMOOO!! ${Application.config.server.port}`);
  }

  /**
   * Inicia o Banco de Dados.
   */
  private initDataBase() {
    this.wiring();
    this.dataBase = Database;
  }

  /**
   * Inicia a rota dos restful.
   */
  private dataBaseReady() {
    new InitRestful(this.router);
    this.accessController = AccessController;
    this.gameController = GameController;
    this.gameBaseController = GameBaseController;
  }

  /**
   * Inicia as configurações do server.
   */
  private serverConfiguration() {
    let barrier = new Barrier();
    this.app.set('view engine', 'ejs');
    this.app.set('views', Path.resolve(__dirname + '/views'));
    Barrier.setStatics(this.app);
    this.app.use(CORS());
    this.app.use('/ehqpeer', this.expressPeerServer(this.server, {key: "ehqpeer"}));
    this.app.use(barrier.validateKey.bind(barrier));
    this.app.use(BodyParser.urlencoded({extended: true}));
    this.app.use(BodyParser.json());
    this.app.use(j2x.middleware);
    this.app.use(zip());
    this.app.use('/favicon.ico', Express.static(Path.resolve(Application.config.images.favicon)));
  }

  /**
   *
   * @returns {any}
   *
   * Inicia o server, se no config estiver que é um https, ele inicia com chave.
   * Caso contrario, ele inicia apenas em http.
   */
  private initServer() {
    if (Application.config.server.https) {
      this.mainPort = Application.config.server.httpsPort;
      let greenlock = new Greenlock();
      HTTP.createServer(greenlock.lex.middleware(RedirectHttps())).listen(Application.config.server.port);
      return HTTPS.createServer(greenlock.lex.httpsOptions, greenlock.lex.middleware(this.app));
    } else {
      this.mainPort = Application.config.server.port;
      return HTTP.createServer(this.app);
    }
  }

  /**
   *
   * @returns {any}
   *
   * Inicia o websocket.
   */
  private initIO() {
    SocketIO(this.server, {pingInterval: 3000,}).on('connect', this.connection.bind(this));
  }

  /**
   *
   * @param socket
   *
   * Inicia a conexão via RTC com o cliente.
   */
  private connection(socket) {
    new OpenRTC({socket: socket});
  }

  public async destroy() {
    return await this.dataBase.destroy();
  }

  public static getPathI18N() {
    return Application.config.directories.i18n;
  }

  private createPaths() {
    if (!fs.existsSync(Path.resolve('resources'))) fs.mkdirSync('resources');
    let paths = Application.config.resourcesPaths;
    if (!paths) return;
    for (let i = 0; i < paths.length; i++) {
      let resolvedPath = Path.resolve(`resources/${paths[i]}`);
      if (!fs.existsSync(Path.resolve(resolvedPath))) fs.mkdirSync(resolvedPath);
    }
  }

}