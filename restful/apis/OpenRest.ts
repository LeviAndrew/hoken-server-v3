import {BasicRest} from "../BasicRest";
import {OpenHandler} from "../../handlers/model/OpenHandler";
import Handler from "../../handlers/model/OpenHandler";
import * as HTTPStatus from 'http-status-codes';

export class OpenRest extends BasicRest {
  // @ts-ignore
  protected _handler: OpenHandler;

  constructor (router) {
    super(router, Handler);

    this.routes = {
      post: {
        '/login/hoken': this.loginHoken.bind(this),
        // '/open/register': this.register.bind(this), // no beergame cria user (já tem no hoken em management)
      },
      get: {
        '/open/available-game': this.readAvailableGame.bind(this), // beergame
        '/open/available-game/:gameId': this.readAvailableGameTeam.bind(this), // beergame
        '/open/available-game/:gameId/:teamId': this.readAvailableGameTeamPosition.bind(this), // beergame
        '/open/available-gameBase': this.readAvailableGameBase.bind(this),
        '/open/available-gameLogis': this.readAvailableGameLogis.bind(this),
        '/open/available-gameLogis/:gameId': this.readAvailableGameTeamLogis.bind(this),
        '/open/available-gameLogis/:gameId/:teamId': this.readAvailableGameTeamPositionLogis.bind(this),
      },
      put: {
        '/open/enter-game': this.enterGame.bind(this), // beergame
        '/open/enter-gameBase': this.enterGameBase.bind(this),
        '/open/enter-gameLogis': this.enterGameLogis.bind(this),
      }
    };

    this.wiring();
  }

  set handler (value: OpenHandler) {
    this._handler = value;
  }

  get handler (): OpenHandler {
    return this._handler;
  }

  set routes (rotas) {
    this._routes = rotas;
  }

  get routes () {
    return this._routes;
  }

  private async getLocale (req, res) {
    let response = await this.handler.getLocale(req.query);
    res
      .status(HTTPStatus.OK)
      .send(response);
  }

  private async loginHoken (req, res) {
    let response = await this.handler.loginHoken(req.body);
    res
      .status(HTTPStatus.OK)
      .send(response);
  }

  private async readAvailableGame(req, res) {
    try {
      const
        response = await this.handler.readAvailableGame();
      res
        .status(HTTPStatus.OK)
        .send(response);
    } catch (e) {
      res
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async readAvailableGameBase(req, res) {
    try {
      const
        response = await this.handler.readAvailableGameBase();
      res
        .status(HTTPStatus.OK)
        .send(response);
    } catch (e) {
      res
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async readAvailableGameLogis(req, res) {
    try {
      const
        response = await this.handler.readAvailableGameLogis();
      res
        .status(HTTPStatus.OK)
        .send(response);
    } catch (e) {
      res
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async readAvailableGameTeam(req, res) {
    try {
      const
        response = await this.handler.readAvailableGameTeam(req.params.gameId);
      res
        .status(HTTPStatus.OK)
        .send(response);
    } catch (e) {
      res
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async readAvailableGameTeamPosition(req, res) {
    try {
      const
        response = await this.handler.readAvailableGameTeamPosition(req.params.gameId, req.params.teamId);
      res
        .status(HTTPStatus.OK)
        .send(response);
    } catch (e) {
      res
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async readAvailableGameTeamLogis(req, res) {
    try {
      const response = await this.handler.readAvailableGameTeamLogis(req.params.gameId);
      res
        .status(HTTPStatus.OK)
        .send(response);
    } catch (e) {
      res
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async readAvailableGameTeamPositionLogis(req, res) {
    try {
      const response = await this.handler.readAvailableGameTeamPositionLogis(req.params.gameId, req.params.teamId);
      res
        .status(HTTPStatus.OK)
        .send(response);
    } catch (e) {
      res
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async enterGame(req, res) {
    try {
      const
        response = await this.handler.enterGame(req.body);
      res
        .status(HTTPStatus.OK)
        .send(response);
    } catch (e) {
      res
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async enterGameBase(req, res) {
    try {
      const
        response = await this.handler.enterGameBase(req.body);
      res
        .status(HTTPStatus.OK)
        .send(response);
    } catch (e) {
      res
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async enterGameLogis(req, res) {
    try {
      const
        response = await this.handler.enterGame(req.body);
      res
        .status(HTTPStatus.OK)
        .send(response);
    } catch (e) {
      res
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

}