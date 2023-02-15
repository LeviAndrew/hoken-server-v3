import * as fs from 'fs';
import * as path from 'path';
import {Source} from "../events/Source";
import {Util} from "../util/Util";
import {FindObject} from "./util/FindObject";

export class BasicHandler extends Source {

  constructor () {
    super();
  }

  /**
   * Verifica os erros de validacao e retorna o correspondente.
   *
   * @param model
   * @param errors
   * @returns {Promise<[any , any , any , any , any , any , any , any , any , any]>}
   */
  private async getErrorsValidation (model, errors) {
    let errorsArray = [];
    for (let attr in errors) {
      if(errors.hasOwnProperty(attr) && !errors[attr].errors) {
        errorsArray.push(Util.getErrorByLocale('pt-Br', model, errors[attr].message));
      }
    }
    return await Promise.all(errorsArray);
  }

  private async getErrorsDuplicationKey (model, msgError) {
    let key = `duplicated.${msgError.slice(msgError.indexOf('index:') + 7, msgError.indexOf('_1 dup'))}`;
    return await Util.getErrorByLocale('pt-Br', model, key);
  }

  private async getErrorsByLocale (model, msgError) {
    return await Util.getErrorByLocale("pt-Br", model, msgError);
  }

  /**
   * Verifica o tipo de erro e pega o padrao de erro correspondente.
   *
   * @param {string} model
   * @param error
   * @returns {Promise<any>}
   */
  private async getError (model: string, error: any) {
    if(typeof error === 'string') {
      return await this.getErrorsByLocale(model, error);
    } else if(typeof error === 'object') {
      if(error.hasOwnProperty('name')) {
        if(error.name === "ValidationError") {
          return await this.getErrorsValidation(model, error.errors);
        } else if(error.name === 'MongoError') {
          if(error.code && error.code === 11000) {
            return await this.getErrorsDuplicationKey(model, error.errmsg);
          }
        } else if(error.name === 'CastError') {
          if(!error.reason) return await this.getErrorsByLocale(model, `${error.name}.${error.path}.${error.kind}`);
          return await this.getErrorsByLocale(model, `${error.reason.name}.${error.reason.path}.${error.reason.kind}`);
        }
      } else if(error.hasOwnProperty('index') && error.hasOwnProperty('msg')) {
        let errorReturn = await this.getErrorsByLocale(model, error.msg);
        errorReturn.description = errorReturn.description + error.index;
        return errorReturn;
      } else if(error.type === "attributeRequired") {
        let errorReturn = await this.getErrorsByLocale(model, error.type);
        errorReturn.description = `${error.errorMessage} is required`;
        return errorReturn;
      }
    }
  }

  /**
   * Funcao responsave por fazer tratamento de retornos, antes de serem
   * enviados para o cliente.
   * Se conter erro, busca o erro correspondente.
   *
   * @returns {Promise<{success, data}>}
   * @param ret
   */
  async returnHandler (ret: { model: string, data: any }) {
    if(ret.data.error) {
      return {
        success: false,
        data: await this.getError(ret.model, ret.data.error),
      };
    }
    return {
      success: true,
      data: ret.data.success
    };
  }

  async updateValidator (data) {
    if(!data.id) return await this.returnHandler({
      model: 'global',
      data: {
        error: 'update.idRequired'
      }
    });
    if(!data.update || !Object.keys(data.update).length) return await this.returnHandler({
      model: 'global',
      data: {
        error: 'update.updateRequire'
      }
    });
    return {
      success: true,
    };
  }

  /**
   *
   * @param attributes
   * @returns {Promise<{success: boolean; data: errorMessage | any[]} | {success: boolean; data: any}>}
   *
   * Chama a funcao para retornar o erro correto.
   */
  protected async getErrorAttributeRequired (attributes) {
    return this.returnHandler({
      model: 'global',
      data: {
        error: {
          type: "attributeRequired",
          errorMessage: attributes,
        }
      }
    })
  }

  protected async getI18N (data: { path: string }) {
    let required = this.attributeValidator(['path'], data);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let files = fs.readdirSync(data.path);
      let success = {};
      for (let i = 0; i < files.length; i++) {
        success[files[i].split('.')[0]] = require(path.join(data.path, files[i]));
      }
      return {success};
    } catch (error) {
      return {error};
    }
  }

  protected getUserIdByAuth (auth: string): Promise<string> {
    try {
      return new Promise(async (resolve, reject) => {
        let ret = await this.sendToServer('db.user.read', new FindObject({
          findOne: true,
          query: {
            authenticationKey: auth,
          },
          select: 'id',
        }));
        if(!ret.data.success || ret.data.error) return reject('invalidUser');
        return resolve(ret.data.success.id);
      })
    } catch (e) {
      throw new Error(e);
    }
  }

  protected getUpdateObject (allowedAttributes: string[], data: object) {
    let update = {};
    let objectKeys = Object.keys(data);
    let allowedSet = new Set(allowedAttributes);
    for (let i = 0; i < objectKeys.length; i++) {
      if(allowedSet.has(objectKeys[i])) update[objectKeys[i]] = data[objectKeys[i]];
    }
    return update;
  }

  protected async readEntityTree (entityId: [string]) {
    let ret = new Set<any>();
    let entitiesDb = await this.sendToServer('db.entity.read', new FindObject({
      query: {
        _id: {
          $in: entityId
        },
        activate: true,
      },
      select: 'children id'
    }));
    this.checkHubReturn(entitiesDb.data);
    const {success} = entitiesDb.data;
    let children = new Set();
    success.forEach(entity => {
      ret.add(entity.id);
      if(entity.children) children = new Set([...children, ...entity.children]);
    });
    if(!!children.size) {
      // @ts-ignore
      const childrenIds = await this.readEntityTree([...children]);
      ret = new Set([...ret, ...childrenIds]);
    }
    return ret;
  }

  protected async basicCreateGame(userId, groups, isApi=false) {
    try {
      const countPromises = await Promise.all([
          this.sendToServer('db.game.count', new FindObject({
            query: {
              teacher: userId,
              gameStatus: {
                $ne: 'finished'  // $ne significa não é igual
              }
            },
          })),
          this.sendToServer('db.game.count', new FindObject({})),
        ]);
      if (countPromises[0].data.error || countPromises[1].data.error) throw 'cannotCreateAnotherGame';
      if (countPromises[0].data.success > 0) throw 'userAlreadyHaveAGame';
      const pin = countPromises[1].data.success + 1;
      return this.sendToServer('game.create', {
        userId,
        groups: groups,
        pin,
        isApi,
      });
    } catch (e) {
      throw e;
    }
  }

  protected async basicCreateGameLogis(userId, groups, isApi=false) {
    try {
      const countPromises = await Promise.all([
          this.sendToServer('db.gameLogis.count', new FindObject({
            query: {
              teacher: userId,
              gameStatus: {
                $ne: 'finished'  // $ne significa não é igual
              }
            },
          })),
          this.sendToServer('db.gameLogis.count', new FindObject({})),
        ]);
      if (countPromises[0].data.error || countPromises[1].data.error) throw 'cannotCreateAnotherGame';
      if (countPromises[0].data.success > 0) throw 'userAlreadyHaveAGame';
      const pin = countPromises[1].data.success + 1;
      return this.sendToServer('gameLogis.create', {
        userId,
        groups: groups,
        pin,
        isApi,
      });
    } catch (e) {
      throw e;
    }
  }

  protected getPlayedStart(gameConfig) {
    return [
      {
        estoqueInicial: 0,
        recebimentoMercadori: gameConfig.productInfos.boxesPerPallet,
        estoqueDisponivel: gameConfig.productInfos.boxesPerPallet,
        recebimentoPedido: gameConfig.productInfos.boxesPerPallet,
        entregaMercadoria: gameConfig.productInfos.boxesPerPallet,
        pendencia: 0,
        estoqueFinal: 0,
        rentStockUsage: 0,
        custo: 0,
        custoTotal: 0,
        deliveryType: 'e1',
        decisao: 1
      },
      {
        estoqueInicial: 0,
        recebimentoMercadori: gameConfig.productInfos.boxesPerPallet,
        estoqueDisponivel: gameConfig.productInfos.boxesPerPallet,
        recebimentoPedido: gameConfig.productInfos.boxesPerPallet,
        entregaMercadoria: gameConfig.productInfos.boxesPerPallet,
        pendencia: 0,
        estoqueFinal: 0,
        rentStockUsage: 0,
        custo: 0,
        custoTotal: 0,
        deliveryType: 'e1',
        decisao: 1
      },
      {
        estoqueInicial: 0,
        recebimentoMercadori: gameConfig.productInfos.boxesPerPallet,
        estoqueDisponivel: gameConfig.productInfos.boxesPerPallet,
        recebimentoPedido: gameConfig.productInfos.boxesPerPallet,
        entregaMercadoria: gameConfig.productInfos.boxesPerPallet,
        pendencia: 0,
        estoqueFinal: 0,
        rentStockUsage: 0,
        custo: 0,
        custoTotal: 0,
        deliveryType: 'e1',
        decisao: null
      }
    ]
  }

}