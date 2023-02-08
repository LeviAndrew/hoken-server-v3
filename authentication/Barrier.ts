import {BarrierHandler} from "../handlers/authentication/BarrierHandler";
import * as HTTPStatus from "http-status-codes";
import * as express from 'express';
import * as path from 'path';

const config = require(path.resolve('authentication/BarrierConfig.json'));

export class Barrier {
  private _handler: BarrierHandler;

  constructor() {
    this.handler = new BarrierHandler();
  }

  private set handler(handler: BarrierHandler) {
    this._handler = handler;
  }

  private get handler(): BarrierHandler {
    return this._handler;
  }

  static setStatics(app) {
    for (let i = 0; i < config.statics.length; i++) {
      app.use(
        config.statics[i].path,
        express.static(path.resolve(config.statics[i].location))
      );
    }
  }

  private static async staticsVerify(modules: [{ path: string; location: string }], path: string): Promise<boolean> {
    for (let i = 0; i < modules.length; i++) {
      if (modules[i].path === path) return true;
    }
    return false;
  }

  private static async openEndpointsVerify(endpoints: string[], path: string): Promise<boolean> {
    for (let i = 0; i < endpoints.length; i++) {
      if (path.startsWith(endpoints[i])) return true;
    }
    return false;
  }

  private static async openAPIVerify(opens: string[], path: string): Promise<boolean> {
    for (let i = 0; i < opens.length; i++) {
      if (opens[i] === path) return true;
    }
    return false;
  }

  private static async openRoute(path: string): Promise<boolean> {
    let verification = await Promise.all([
      Barrier.staticsVerify(config.statics, path),
      Barrier.openEndpointsVerify(config.openEndpoints, path),
      Barrier.openAPIVerify(config.openAPI, path)
    ]);
    for (let i = 0; i < verification.length; i++) {
      if (verification[i]) return verification[i];
    }
    return false;
  }

  async validateKey(req, res, next) {
    if (await Barrier.openRoute(req.path)) {
      return next();
    }
    if (req.path.startsWith('/api/platform') && req.headers["platform-key"]) {
      const checkReturn = await this.handler.checkPkey(req.headers['platform-key']);
      if (!checkReturn.success) {
        return res.status(HTTPStatus.UNAUTHORIZED).send(checkReturn.data);
      }
      return next();
    } else if (req.headers["authentication-key"]) {
      let checkReturn = await this.handler.checkLoggedUser({
        authenticationKey: req.headers["authentication-key"],
        accessKey: req.headers["access-key"],
      });
      if (!checkReturn.success) {
        return res.status(HTTPStatus.UNAUTHORIZED).send(checkReturn.data);
      }
      return next();
    } else {
      let error = await this.handler.returnHandler({
        model: 'global',
        data: {error: 'invalidPath'}
      });
      return res
        .status(HTTPStatus.NOT_FOUND)
        .send(error);
    }
  }

}