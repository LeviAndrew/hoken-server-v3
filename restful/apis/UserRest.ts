import {BasicRest} from "../BasicRest";
import {User} from "../../handlers/model/User";
import Handler from "../../handlers/model/User";
import * as HTTPStatus from 'http-status-codes';

export class UserRest extends BasicRest {
  // @ts-ignore
  protected _handler: User;

  constructor (router) {
    super(router, Handler);

    this.routes = {
      post: {
        '/user/logout': this.logout.bind(this),
        '/user/password': this.updatePassword.bind(this),
        '/user/setting': this.createUpdateUserSettings.bind(this),
        '/user/settingBase': this.createUpdateUserSettingsBase.bind(this),
        '/user/settingLogis': this.createUpdateUserSettingsLogis.bind(this),
        '/user/game': this.createGame.bind(this),
        '/user/gameBase': this.createGameBase.bind(this),
        '/user/gameLogis': this.createGameLogis.bind(this),
      },
      put: {
        '/user/info': this.updateInfo.bind(this),
        '/user/password': this.updatePassword.bind(this),
      },
      get: {
        '/user/setting': this.getSetting.bind(this),
        '/user/settingBase': this.getSettingBase.bind(this),
        '/user/settingLogis': this.getSettingLogis.bind(this),
        '/user/game': this.getGame.bind(this),
        '/user/reports-available': this.getAvailableReports.bind(this),
        '/user/reports-availableLogis': this.getAvailableReportsLogis.bind(this),
        '/user/report/:id': this.readGameDetail.bind(this),
        '/user/reportLogis/:id': this.readLogisGameDetail.bind(this),
        '/user/currentGame/:id': this.readCurrentGame.bind(this),
        '/user/currentGameLogis/:id': this.readCurrentGameLogis.bind(this),
        '/user/report/xlsx/:id': this.downloadReportXLSX.bind(this),
        '/user/reportLogis/xlsx/:id': this.downloadReportLogisXLSX.bind(this),
        '/user/entities': this.entitiesRead.bind(this),
        '/user/entity/children/:entityId': this.entityChildrenRead.bind(this),
      },
      delete: {
        '/user/setting': this.deleteSetting.bind(this),
        '/user/settingBase': this.deleteSettingBase.bind(this),
        '/user/settingLogis': this.deleteSettingLogis.bind(this),
      }
    };

    this.wiring();
  }

  set handler (value: User) {
    this._handler = value;
  }

  get handler (): User {
    return this._handler;
  }

  set routes (rotas) {
    this._routes = rotas;
  }

  get routes () {
    return this._routes;
  }

  private async logout (request, response) {
    let ret = await this.handler.logout({
      auth: request.headers['authentication-key'],
      aKey: request.headers['access-key'],
    });
    response
      .status(HTTPStatus.OK)
      .send(ret);
  }

  private async updatePassword (request, response) {
    let ret = await this.handler.updatePassword({
      auth: request.headers['authentication-key'],
      currentPassword: request.body.currentPassword,
      newPassword: request.body.newPassword,
    });
    response
      .status(HTTPStatus.OK)
      .send(ret);
  }

  private async entitiesRead (request, response) {
    let ret = await this.handler.entitiesRead({
      auth: request.headers['authentication-key'],
    });
    response
      .status(HTTPStatus.OK)
      .send(ret);
  }

  private async entityChildrenRead (request, response) {
    let ret = await this.handler.entityChildrenRead({
      auth: request.headers['authentication-key'],
      entityId: request.params.entityId,
    });
    response
      .status(HTTPStatus.OK)
      .send(ret);
  }

  private async getSetting(request, response) {
    try {
      const ret = await this.handler.getSetting({
          auth: request.headers['authentication-key'],
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

  private async getSettingBase(request, response) {
    try {
      const ret = await this.handler.getSettingBase({
          auth: request.headers['authentication-key'],
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

  private async getSettingLogis(request, response) {
    try {
      const ret = await this.handler.getSettingLogis({
          auth: request.headers['authentication-key'],
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

  private async createUpdateUserSettings(request, response) {
    try {
      const ret = await this.handler.createUpdateUserSettings({
          auth: request.headers['authentication-key'],
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

  private async createUpdateUserSettingsBase(request, response) {
    try {
      const
        ret = await this.handler.createUpdateUserSettingsBase({
          auth: request.headers['authentication-key'],
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

  private async createUpdateUserSettingsLogis(request, response) {
    try {
      const ret = await this.handler.createUpdateUserSettingsLogis({
          auth: request.headers['authentication-key'],
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

  private async deleteSetting(request, response) {
    try {
      const ret = await this.handler.deleteSetting({
          auth: request.headers['authentication-key'],
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

  private async deleteSettingBase(request, response) {
    try {
      const
        ret = await this.handler.deleteSettingBase({
          auth: request.headers['authentication-key'],
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
          auth: request.headers['authentication-key'],
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

  private async createGameBase(request, response) {
    try {
      const
        ret = await this.handler.createGameBase({
          auth: request.headers['authentication-key'],
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
          auth: request.headers['authentication-key'],
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

  private async getGame(request, response) {
    try {
      const
        ret = await this.handler.getGame({
          auth: request.headers['authentication-key'],
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

  private async updateInfo(request, response) {
    try {
      const
        ret = await this.handler.updateInfo({
          auth: request.headers['authentication-key'],
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

  private async getAvailableReports(request, response) {
    try {
      const ret = await this.handler.getAvailableReports({
          auth: request.headers['authentication-key'],
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
          auth: request.headers['authentication-key'],
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

  private async readGameDetail(request, response) {
    try {
      const ret = await this.handler.readGameDetail({
          auth: request.headers['authentication-key'],
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

  private async readLogisGameDetail(request, response) {
    try {
      const ret = await this.handler.readLogisGameDetail({
          auth: request.headers['authentication-key'],
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

  private async readCurrentGame(request, response) {
    try {
      const ret = await this.handler.readCurrentGame({
          auth: request.headers['authentication-key'],
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

  private async readCurrentGameLogis(request, response) {
    try {
      const ret = await this.handler.readCurrentGameLogis({
          auth: request.headers['authentication-key'],
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

  private async downloadReportXLSX(request, response) {
    try {
      const ret = await this.handler.jsonToXLSX({
          auth: request.headers['authentication-key'],
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

  private async downloadReportLogisXLSX(request, response) {
    try {
      const ret = await this.handler.jsonToXLSXLogis({
          auth: request.headers['authentication-key'],
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

  private async deleteSettingLogis(request, response) {
    try {
      const ret = await this.handler.deleteSettingLogis({
          auth: request.headers['authentication-key'],
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

}