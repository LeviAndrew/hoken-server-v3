import * as crypto from "crypto";
import * as path from "path";
import * as fs from "fs";
import {errorMessage} from '../interfaces/Util';

export class Util {

  /**
   *
   * @param toDecrypt
   * @param {string} privateKeyPath
   * @returns {string}
   *
   * Decripta msgs encriptada com a nossa chave puclica utiliazando a nossa chave privada.
   */
  public static decryptWithPrivateKey(toDecrypt, privateKeyPath = "util/privkey.pem"): string {
    let absolutePath = path.resolve(privateKeyPath);
    let privateKey = fs.readFileSync(absolutePath, "utf8");
    let buffer = new Buffer(toDecrypt, "base64");
    let decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString("utf8");
  };

  /**
   *
   * @returns {string}
   * @param encryptionMethod
   * @param word
   *
   * Retorna o formato criptografado da palavra.
   */
  public static encrypt(encryptionMethod, word): string {
    return crypto.createHash(encryptionMethod).update(word).digest('hex');
  }

  /**
   *
   * @param error
   * @param fileName
   * @returns {errorMessage}
   *
   * Caso não seja encontrado algum erro, esse metodo retorna essa msg.
   */
  private static getUnexpectedError(error, fileName): errorMessage {
    return {
      title: "Unexpected error",
      description: `We didn't find an answer to error ${error} on model ${fileName}`,
      buttons: [
        {
          label: "Send this error",
          method: "sendError"
        }
      ],
      type: "unexpectedError"
    }
  }

  /**
   *
   * @param typeError
   * @param errorObj
   * @param fileName
   * @returns {errorMessage}
   *
   * Encontra a message de erro que corresponde ao tipo de erro passado, no arquivo passado.
   */
  private static getValueByTypeError(typeError, errorObj, fileName): errorMessage {
    if (typeError.includes('.')) {
      let nodeType = typeError.slice(0, typeError.indexOf('.'));
      let subType = typeError.slice(typeError.indexOf('.') + 1, typeError.length);
      let endSub = subType.length;
      if (subType.includes('.')) endSub = subType.indexOf('.');
      if (!errorObj[nodeType]) return this.getUnexpectedError(nodeType, fileName);
      if (!errorObj[nodeType][subType.slice(0, endSub)]) return this.getUnexpectedError(`${nodeType}.${subType}`, fileName);
      return Util.getValueByTypeError(subType, errorObj[nodeType], fileName);
    }
    if (!errorObj[typeError]) return this.getUnexpectedError(typeError, fileName);
    return errorObj[typeError];
  }

  /**
   *
   * @param {string} locale
   * @param {string} fileName
   * @param {string} type_error
   * @returns {Promise<errorMessage>}
   *
   * Encontra a pasta de erros referente ao locale passado por parametro.
   */
  public static async getErrorByLocale(locale: string, fileName: string, type_error: string): Promise<errorMessage> {
    if (!fs.existsSync(`locale/${locale}/errors/${fileName}.json`)) return this.getUnexpectedError(type_error, fileName);
    let error_obj = await require(path.resolve(`locale/${locale}/errors/${fileName}`));
    return Util.getValueByTypeError(type_error, error_obj, fileName);
  }

  /**
   *
   * @param doc
   * @param {string} fileName
   * @returns {Promise<string>}
   *
   * Salva um arquivo base64 em um xls e rotorna o caminho completo onde este foi salvo.
   */
  public static writeXLS(doc: string, fileName: string): Promise<string> {
    if (!fs.existsSync(path.resolve('resources/temp'))) fs.mkdirSync(path.resolve('resources/temp'));
    return new Promise((resolve, reject) => {
      let source: string = path.resolve(`resources/temp/${fileName}.xls`);
      fs.writeFile(source, doc, {encoding: `base64`}, (error) => {
        if (error) return reject(error);
        return resolve(source);
      });
    });
  }

  /**
   *
   * @param {string} documentSource
   * @returns {Promise<boolean>}
   *
   * Remove um documento salvo no caminho passado por paremetro e retorna true, caso tenha ocorrido sucesso
   * e false caso não tenha ocorrido.
   */
  public static removeFile(documentSource: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.unlink(documentSource, (error) => {
        if (!error) return resolve(true);
        return reject(false);
      })
    });
  }

  public static async arrayShuflle(array){
    for(let i = array.length-1; i >= 0; i--){
      let randomIndex = Math.floor(Math.random()*(i+1));
      let itemAtIndex = array[randomIndex];
      array[randomIndex] = array[i];
      array[i] = itemAtIndex;
    }
  }

}