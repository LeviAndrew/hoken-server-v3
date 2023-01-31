import {Hub} from "./Hub";
import {v4} from "node-uuid";

export class Source {
  _id: string;
  _hub: Hub;

  constructor() {
    this.id = v4();
    this.hub = Hub.getInstance();
  }

  set id(uuid) {
    this._id = uuid;
  }

  get id() {
    return this._id;
  }

  set hub(hub) {
    this._hub = hub;
  }

  get hub() {
    return this._hub;
  }

  /**
   *
   * @param {any[]} requiredAttributes
   * @param data
   * @returns {boolean}
   *
   * Verifica se existe algum dos atributos dos dados passados.
   */
  private orValidator(requiredAttributes: any[], data: any) {
    for (let i = 0; i < requiredAttributes.length; i++) {
      if (typeof data[requiredAttributes[i]] !== 'undefined' && data[requiredAttributes[i]] !== null) return true;
    }
    return false;
  }

  /**
   *
   * @param {any[]} requiredAttributes
   * @param data
   * @returns {any}
   *
   * Faz o tratamento para verificar se os dados obrigatorios da funcao estao sendo mandados.
   */
  protected attributeValidator(requiredAttributes: any[], data: any): { success: boolean, error?: string } {
    for (let i = 0; i < requiredAttributes.length; i++) {
      if (Array.isArray(requiredAttributes[i])) {
        let verified = this.attributeValidator(requiredAttributes[i], data[requiredAttributes[i - 1]]);
        if (!verified.success) {
          verified.error = `${requiredAttributes[i - 1]}:{ ${verified.error} }`;
          return verified;
        }
      } else {
        if (requiredAttributes[i] === "$or") {
          let orVerified = this.orValidator(requiredAttributes[i + 1], data[requiredAttributes[i - 1]]);
          if (!orVerified) {
            let errorMessage = ``;
            for (let e = 0; e < requiredAttributes[i + 1].length; e++) {
              if (e !== requiredAttributes[i + 1].length - 1) {
                errorMessage = `${errorMessage} ${requiredAttributes[i + 1][e]} or `
              } else {
                errorMessage = `${errorMessage} ${requiredAttributes[i + 1][e]} `
              }
            }
            i++;
            return {
              success: false,
              error: `${errorMessage}`
            }
          }
          i++;
        } else {
          if (typeof data[requiredAttributes[i]] === 'undefined' ||
            data[requiredAttributes[i]] === null) return {
            success: false,
            error: `${requiredAttributes[i]}`
          };
        }
      }
    }
    return {success: true};
  }

  protected checkHubReturn(data: { error?: any, success?: any }) {
    if (!!!data.success && Number.isNaN(data.success)) throw new Error('empty');
    if (data.error) throw new Error(data.error);
  }

  /**
   * Call this method everytime, to avoid leak on the HUB. if you like
   * to override this,
   * call super.destroy after your code.
   */
  destroy() {
    this.hub.send(this, "hub.core.source.destroyed", {
      error: null,
      success: this.id,
    });
    this.id = null;
  }
}