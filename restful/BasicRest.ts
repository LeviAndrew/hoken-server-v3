import {BasicHandler} from "../handlers/BasicHandler";

export abstract class BasicRest {
  private _router: any;
  protected _handler: BasicHandler;
  protected _routes: any;

  protected constructor(router, handler) {
    this._handler = handler;
    this.router = router;
  }

  set router(router) {
    if (!router) {
      throw new Error('Toda api deve conter o router');
    }

    this._router = router;
  }

  get router() {
    return this._router;
  }

  abstract set handler(handler);

  abstract get handler();

  /**
   * Responsavel por ligar as requisicoes get.
   *
   * @param rotas
   */
  get(rotas) {
    for (let name in rotas) {
      if (rotas.hasOwnProperty(name)) {
        this.router.route(name).get(rotas[name]);
      }
    }
  }

  /**
   * Responsavel por ligar as requisicoes post.
   *
   * @param rotas
   */
  post(rotas) {
    for (let name in rotas) {
      if (rotas.hasOwnProperty(name)) {
        this.router.route(name).post(rotas[name]);
      }
    }
  }

  /**
   * Responsavel por ligar as requisicoes put.
   *
   * @param rotas
   */
  put(rotas) {
    for (let name in rotas) {
      if (rotas.hasOwnProperty(name)) {
        this.router.route(name).put(rotas[name]);
      }
    }
  }

  /**
   * Responsavel por ligar as requisicoes delete.
   *
   * @param rotas
   */
  delete(rotas) {
    for (let name in rotas) {
      if (rotas.hasOwnProperty(name)) {
        this.router.route(name).delete(rotas[name]);
      }
    }
  }

  abstract get routes();
  abstract set routes(value);

  /**
   * Liga as rotas as funções, simulando o evento.
   */
  wiring() {
    for (let name in this.routes) {
      if (this.routes.hasOwnProperty(name) && this.routes[name]) {
        this[name](this.routes[name]);
      }
    }
  }
}