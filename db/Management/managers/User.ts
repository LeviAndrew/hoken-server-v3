import {BasicManager} from "../../BasicManager";
import {Model} from "../model/User";

let bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 10;

export class User extends BasicManager {
  wireCustomListeners() {
    this.hub.on("db." + this.eventName + ".login", this.login.bind(this));
    this.hub.on("db." + this.eventName + ".verifyPassword", this.verifyPassword.bind(this));
    this.hub.on("db." + this.eventName + ".import", this.importUser.bind(this));
  }

  private async importUser(msg) {
    if (msg.source_id === this.id) return;
    this.import(msg.data.success).then((ret) => {
      this.answer(msg.id, "import", ret, null);
    }).catch((error) => {
      this.answer(msg.id, "import", null, error);
    });
  }

  protected async import(data) {
    data = await this.beforeImport(data);
    let ret: any = await this.model.create(data);
    return this.afterCreate(Array.isArray(ret) ? ret : [ret]);
  }

  protected async beforeImport(data) {
    const password = await this.cipherImportPassword(data[0].password);
    for (let i = 0; i < data.length; ++i) {
      data[i]._id = data[i]._id ? this.objectIdGenerator(data[i]._id) : this.objectIdGenerator();
      data[i].id = data[i]._id.toString();
      data[i].authenticationKey = this.objectIdGenerator().toString();
      data[i].password = password;
    }
    return data;
  }

  cipherImportPassword(password) {
    return new Promise((resolve, reject) => {
      if (!password) return reject('passwordRequired');
      bcrypt.genSalt(SALT_WORK_FACTOR, (error, salt) => {
        if (error) return reject(error);
        bcrypt.hash(password, salt, (error, hash) => {
          if (error) return reject(error);
          resolve(hash);
        });
      });
    });
  }

  /**
   * Verifica se o usuario existe no banco de dados.
   * Se não existe, enviar um erro informando isso.
   * Se existe, verifica se a senha enviada bate com a registrada no banco de dados.
   * Se a senha não bate, retorna um erro informando isso.
   * Se a senha bate, seta o atributo logged para true e retorna os dados do usuario logado.
   * @param msg
   * @returns {Promise<void>}
   */
  private async login(msg) {
    if (msg.source_id === this.id) return;
    let userPassword = msg.data.success.password;
    let query = this.model
      .find(msg.data.success.queryObject.query)
      .select(`${msg.data.success.queryObject.select} password`)
      .lean();
    if (msg.data.success.queryObject.populate) query.populate(msg.data.success.queryObject.populate);
    let ret = await query.exec();
    if (ret.length === 1) {
      let userRet: any = ret[0];
      if (!await this.comparePassword({
        userPassword,
        hashPassword: userRet.password
      }) && msg.data.success.password !== 'ldap') {
        return this.answer(msg.id, "login", null, "wrongPassword");
      }
      delete userRet.password;
      return this.answer(msg.id, 'login', userRet, null);
    } else {
      this.answer(msg.id, "login", null, "userNotFound");
    }
  }

  private async verifyPassword(msg) {
    if (msg.source_id === this.id) return;
    try {
      let ret: any = await this.model
        .findById(msg.data.success.userId)
        .select('password')
        .lean()
        .exec();
      if (!ret) return this.answer(msg.id, 'verifyPassword', null, 'userNotFound');
      let compare = await this.comparePassword({
        userPassword: msg.data.success.password,
        hashPassword: ret.password
      });
      return this.answer(msg.id, 'verifyPassword', compare, null);
    } catch (e) {
      return this.answer(msg.id, 'verifyPassword', null, e);
    }
  }

  private async comparePassword({userPassword, hashPassword}: comparePassword) {
    return bcrypt.compare(userPassword, hashPassword);
  }

  protected async beforeUpdate(data) {
    if (data.update.$set && data.update.$set.password) {
      await this.cipherPassword(data.update.$set);
    }
    return data;
  }

  protected async beforeCreate(data) {
    let promises = [];
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; ++i) {
        data[i]._id = data[i]._id ? this.objectIdGenerator(data[i]._id) : this.objectIdGenerator();
        data[i].id = data[i]._id.toString();
        data[i].authenticationKey = this.objectIdGenerator().toString();
        promises.push(this.cipherPassword(data[i]));
      }
    } else {
      data._id = data._id ? this.objectIdGenerator(data._id) : this.objectIdGenerator();
      data.id = data._id.toString();
      data.authenticationKey = this.objectIdGenerator().toString();
      promises.push(this.cipherPassword(data));
    }
    await Promise.all(promises);
    return data;
  }

  cipherPassword(data) {
    return new Promise((resolve, reject) => {
      if (!data.password) return reject('passwordRequired');
      bcrypt.genSalt(SALT_WORK_FACTOR, (error, salt) => {
        if (error) return reject(error);
        bcrypt.hash(data.password, salt, (error, hash) => {
          if (error) return reject(error);
          data.password = hash;
          resolve(null);
        });
      });
    });
  }

  afterCreate(data: any[]) {
    for (let i = 0; i < data.length; i++) {
      data[i] = data[i].toJSON();
      delete data[i].authenticationKey;
      delete data[i].createdAt;
      delete data[i].password;
      delete data[i].removed;
      delete data[i].updatedAt;
    }
    return data;
  }

  /**
   * Faz as modificações/operações necessárias no retorno do read
   *
   * @param data
   */
  afterRead(data) {
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; ++i) {
        delete data[i].password;
        delete data[i]._id;
      }
    } else {
      delete data.password;
      delete data._id;
    }
    return data;
  }

  afterUpdate(data) {
    for (let i = 0; i < data.length; i++) {
      data[i] = data[i].toJSON();
      delete data[i].password;
    }

    return data;
  }

  get model() {
    return Model;
  }

  get eventName() {
    return 'user';
  }
}

interface comparePassword {
  userPassword: any,
  hashPassword: any,
}