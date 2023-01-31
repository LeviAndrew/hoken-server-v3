import {Source} from "../events/Source";
import {Types, Model} from "mongoose";

export abstract class BasicManager extends Source {
  constructor () {
    super();
    this.wiring();
  }

  /**
   *
   * @param data
   *
   * Funcao chamado antes do create para fazer as operações necessárias com o(s)
   * dado(s) do(s) objeto(s) que será(ão) criado(s)
   */
  protected beforeCreate (data) {
    if(Array.isArray(data)) {
      for (let i = 0; i < data.length; ++i) {
        data[i]._id = data[i]._id ? this.objectIdGenerator(data[i]._id) : this.objectIdGenerator();
        data[i].id = data[i]._id.toString();
      }
    } else {
      data._id = data._id ? this.objectIdGenerator(data._id) : this.objectIdGenerator();
      data.id = data._id.toString();
    }
    return data;
  }

  protected objectIdGenerator (id?: string): Types.ObjectId {
    return id ? new Types.ObjectId(id) : new Types.ObjectId();
  }

  /**
   *
   * @param data
   *
   * Funcao chamada após o create.
   */
  protected afterCreate (data: any[]) {
    for (let i = 0; i < data.length; i++) {
      data[i] = data[i].toJSON();
    }
    return data;
  }

  /**
   *
   * @param data
   *
   * Responsvel por executar o beforeCreate, create e afterCreate.
   */
  protected async create (data) {
    data = await this.beforeCreate(data);
    let ret: any = await this.model.create(data);
    return this.afterCreate(Array.isArray(ret) ? ret : [ret]);
  }

  /**
   *
   * @param msg
   *
   * Recebe o evento de criacao e chama a funçao reponsavel pela ação.
   * Deixa passar apenas as função que não são resposatas dela mesma.
   */
  protected handleCreate (msg) {
    if(msg.source_id === this.id) return;
    this.create(msg.data.success).then((ret) => {
      this.answer(msg.id, "create", ret, null);
    }).catch((error) => {
      this.answer(msg.id, "create", null, error);
    });
  }

  /**
   *
   * @param data
   *
   * Faz tratamentos necesários nos dados antes de executar o read
   */
  protected beforeRead (data) {
    return data;
  }

  /**
   *
   * @param data
   *
   * Faz as operações necessárias após do read
   */
  protected afterRead (data) {
    if(Array.isArray(data)) {
      for (let i = 0; i < data.length; ++i) {
        delete data[i]._id;
      }
    } else if(data && typeof data === 'object') {
      delete data._id;
    }
    return data;
  }

  /**
   *
   * @param data
   *
   * Le um ou todos os documentos de uma determinada colecao no banco.
   * Respeitando a query.
   */
  protected async read (data) {
    data = await this.beforeRead(data);
    let result: any;
    let find: any;
    if(data.id) {
      find = this.model.findById(data.id);
    } else if(data.findOne) {
      find = this.model.findOne(data.query);
    } else if(data.query) {
      find = this.model.find(data.query);
    }
    find.select(data.select);
    if(data.populate) find.populate(data.populate);
    if(data.limit) find.limit(data.limit);
    if(data.skip) find.skip(data.skip);
    if(data.sort) find.sort(data.sort).collation(data.collation);
    result = await find.lean().exec();
    return await this.afterRead(result);
  }

  /**
   *
   * @param msg
   *
   * Handler read request.
   */
  protected handleRead (msg) {
    if(msg.source_id === this.id) return;
    this.read(msg.data.success).then((ret) => {
      this.answer(msg.id, "read", ret, null);
    }).catch((error) => {
      this.answer(msg.id, "read", null, error);
    });
  }

  /**
   *
   * @param data
   * @returns {any}
   *
   * Handler a update data before a real update.
   */
  protected beforeUpdate (data) {
    return data;
  }

  /**
   *
   * @param data
   * @returns {any}
   *
   * Handler the update result data.
   */
  protected afterUpdate (data) {
    if(Array.isArray(data)) {
      for (let i = 0; i < data.length; ++i) {
        delete data[i]._id;
      }
    } else {
      delete data._id;
    }
    return data;
  }

  /**
   *
   * @param data
   * @returns {Promise<any>}
   *
   * Make a update on mongoDB
   */
  protected async update (data) {
    data = await this.beforeUpdate(data);
    let update = null;
    if(data.id) {
      update = this.model.findByIdAndUpdate(data.id, data.update, data.options);
    } else if(data.options && data.options.updateOne) {
      delete data.options.updateOne;
      update = this.model.updateOne(data.query, data.update, data.options);
    } else {
      update = this.model.updateMany(data.query, data.update, data.options);
    }
    if(data.populate) update.populate(data.populate);
    let result = await update.lean().exec();
    return await this.afterUpdate(result);
  }

  /**
   *
   * @param msg
   * @returns {Promise<void>}
   *
   * Handler a update request.
   */
  protected async handleUpdate (msg) {
    if(msg.source_id === this.id) return;
    this.update(msg.data.success).then((ret) => {
      this.answer(msg.id, "update", ret, null);
    }).catch((error) => {
      this.answer(msg.id, "update", null, error);
    });
  }

  /**
   *
   * @param data
   * @returns {any}
   *
   * Handler a update data before a real delete.
   */
  beforeDelete (data) {
    return data;
  }

  /**
   *
   * @param result
   * @returns {any}
   *
   * Handler the delete result data.
   */
  afterDelete (result) {
    return result;
  }

  /**
   *
   * @param data
   * @returns {Promise<any>}
   *
   * Delete a model from mongoDB.
   */
  async delete (data) {
    data = await this.beforeDelete(data);
    let del = null;
    if(data.id) {
      del = this.model.findOneAndDelete({_id: data.id});
    } else {
      del = this.model.deleteMany(data.query);
    }
    let result = await del.lean().exec();
    return this.afterDelete(result);
  }

  /**
   *
   * @param msg
   *
   * Handler a delete request.
   */
  handleDelete (msg) {
    if(msg.source_id === this.id) return;
    this.delete(msg.data.success).then((ret) => {
      this.answer(msg.id, "delete", ret, null);
    }).catch((error) => {
      this.answer(msg.id, "delete", null, error);
    });
  }

  /**
   *
   * @param data
   * @returns {Promise<number>}
   *
   * Make a count of models on mongoDB, based in the data query.
   */
  async count (data): Promise<number> {
    let count = null;
    if(data.id) {
      count = this.model.countDocuments({_id: data.id});
    } else {
      count = this.model.countDocuments(data.query);
    }
    return count.exec();
  }

  /**
   *
   * @param msg
   * @returns {Promise<void>}
   *
   * Handler a count request.
   */
  async handleCount (msg): Promise<void> {
    if(msg.source_id === this.id) return;
    this.count(msg.data.success)
      .then((ret) => {
        this.answer(msg.id, "count", ret, null);
      })
      .catch((error) => {
        this.answer(msg.id, "count", null, error);
      })
  }

  /**
   *
   * @param data
   * @returns {Promise<any>}
   *
   * Make a aggregate on MongoDB.
   */
  async aggregate (data) {
    return this.model.aggregate(data).exec();
  }

  /**
   *
   * @param msg
   *
   * Handler a aggregate request.
   */
  handleAggregate (msg) {
    if(msg.source_id === this.id) return;
    this.aggregate(msg.data.success)
      .then(ret => {
        this.answer(msg.id, 'aggregate', ret, null);
      })
      .catch(err => {
        this.answer(msg.id, 'aggregate', null, err);
      })
  }

  /**
   *
   * @param messageId
   * @param event
   * @param success
   * @param error
   *
   * Make a answer to a message represented for a messageId param.
   */
  answer (messageId, event, success, error) {
    let data = {
      success: success,
      error: error
    };
    this.hub.send(this, "db." + this.eventName + "." + event, data, messageId);
  }

  wiring () {
    this.hub.on("db." + this.eventName + ".create", this.handleCreate.bind(this));
    this.hub.on("db." + this.eventName + ".read", this.handleRead.bind(this));
    this.hub.on("db." + this.eventName + ".update", this.handleUpdate.bind(this));
    this.hub.on("db." + this.eventName + ".delete", this.handleDelete.bind(this));
    this.hub.on("db." + this.eventName + ".count", this.handleCount.bind(this));
    this.hub.on("db." + this.eventName + ".aggregate", this.handleAggregate.bind(this));
    this.wireCustomListeners();
  }

  abstract wireCustomListeners ();

  abstract get model (): Model<any>;

  abstract get eventName (): string;
}