import {BasicRest} from "../BasicRest";
import {Platform} from "../../handlers/model/Platform"
import Handler from "../../handlers/model/Platform"
import * as HTTPStatus from 'http-status-codes'

export class PlatformRest extends BasicRest {
    // @ts-ignore
  protected _handler: Platform;

  constructor(router) {
    // @ts-ignore
    super(router);
    this._handler = Handler;

    this.routes = {
      post: {
        '/platform/register': this.register.bind(this),
        '/platform/game': this.createGame.bind(this),
        "/platform/gameLogis": this.createGameLogis.bind(this),
      },
      get: {
        '/platform/reports-available': this.getAvailableReports.bind(this),
        '/platform/report/:id': this.readGameDetail.bind(this),
        '/platform/report/xlsx/:id': this.downloadReportXLSX.bind(this),
        '/platform/reports-availableLogis': this.getAvailableReportsLogis.bind(this),
        '/platform/reportLogis/:id': this.readGameDetailLogis.bind(this),
        "/platform/reportLogis/xlsx/:id": this.downloadReportXLSXLogis.bind(this),
      },
    };

    this.wiring();
  }

  set handler(value: Platform) {
    this._handler = value;
  }

  get handler(): Platform {
    return this._handler;
  }

  set routes(rotas) {
    this._routes = rotas;
  }

  get routes() {
    return this._routes;
  }

  private async register(request, response) {
    try {
      const ret = await this.handler.register({
          pKey: request.headers['platform-key'],
          data: request.body,
        });
      response
        .status(HTTPStatus.OK)
        .send(ret);
    } catch (e) {
      response
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async createGame(request, response) {
    try {
      const ret = await this.handler.createGame({
          pKey: request.headers['platform-key'],
          userId: request.headers['user-id'],
          data: request.body,
        });
      response
        .status(HTTPStatus.OK)
        .send(ret);
    } catch (e) {
      response
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async createGameLogis(request, response) {
    try {
      const ret = await this.handler.createGameLogis({
        pKey: request.headers["platform-key"],
        userId: request.headers["user-id"],
        data: request.body,
      });
      response.status(HTTPStatus.OK).send(ret);
    } catch (e) {
      response.status(HTTPStatus.INTERNAL_SERVER_ERROR).send(e);
    }
  }

  private async getAvailableReports(request, response) {
    try {
      const ret = await this.handler.getAvailableReports({
          pKey: request.headers['platform-key'],
          userId: request.headers['user-id'],
          data: null,
        });
      response
        .status(HTTPStatus.OK)
        .send(ret);
    } catch (e) {
      response
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async getAvailableReportsLogis(request, response) {
    try {
      const ret = await this.handler.getAvailableReportsLogis({
        pKey: request.headers["platform-key"],
        userId: request.headers["user-id"],
        data: null,
      });
      response.status(HTTPStatus.OK).send(ret);
    } catch (e) {
      response.status(HTTPStatus.INTERNAL_SERVER_ERROR).send(e);
    }
  }

  private async readGameDetail(request, response) {
    try {
      const ret = await this.handler.readGameDetail({
          pKey: request.headers['platform-key'],
          userId: request.headers['user-id'],
          data: {
            id: request.params.id,
          },
        });
      response
        .status(HTTPStatus.OK)
        .send(ret);
    } catch (e) {
      response
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async readGameDetailLogis(request, response) {
    try {
      const ret = await this.handler.readGameDetailLogis({
        pKey: request.headers["platform-key"],
        userId: request.headers["user-id"],
        data: {
          id: request.params.id,
        },
      });
      response.status(HTTPStatus.OK).send(ret);
    } catch (e) {
      response.status(HTTPStatus.INTERNAL_SERVER_ERROR).send(e);
    }
  }

  private async downloadReportXLSX(request, response) {
    try {
      const ret = await this.handler.jsonToXLSX({
          pKey: request.headers['platform-key'],
          userId: request.headers['user-id'],
          data: {
            id: request.params.id,
          },
        });
      if (!ret.success) response
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send("cannotDownloadXLSX");
      response
        .status(HTTPStatus.OK)
        .xls(`repost.xlsx`, ret.data);
    } catch (e) {
      response
        .status(HTTPStatus.INTERNAL_SERVER_ERROR)
        .send(e);
    }
  }

  private async downloadReportXLSXLogis(request, response) {
    try {
      const ret = await this.handler.jsonToXLSXLogis({
        pKey: request.headers["platform-key"],
        userId: request.headers["user-id"],
        data: {
          id: request.params.id,
        },
      });
      if (!ret.success)
        response
          .status(HTTPStatus.INTERNAL_SERVER_ERROR)
          .send("cannotDownloadXLSX");
      response.status(HTTPStatus.OK).xls(`repost.xlsx`, ret.data);
    } catch (e) {
      response.status(HTTPStatus.INTERNAL_SERVER_ERROR).send(e);
    }
  }

}