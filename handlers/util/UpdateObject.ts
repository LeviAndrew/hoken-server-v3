import {BaseUtil, Populate} from './BaseUtil';

interface UpdateData {
  query: object | string,
  update: any,
  new?: boolean,
  runValidators?: boolean,
  populate?: Populate[],
  select?: string[],
  options?: any,
}

export class UpdateObject extends BaseUtil {
  private _options: object;
  private _update: Object;

  constructor(data: UpdateData) {
    super();
    this.query = data.query;
    this.update = data.update;
    this.populate = data.populate;
    this.newResponse = data.new ? data.new : true;
    this.runValidators = data.runValidators ? data.runValidators : true;
    this.options = data.options;
    this.select = data.select;
  };

  public set query(query: object | string) {
    if (typeof query === "string") {
      this.id = query;
    } else {
      this._query = {...this._query, ...query};
    }
  }

  public get query(): object | string {
    return this._query;
  }

  public set update(update: any) {
    this._update = this.handlerSetUpdate(update);
  }

  public get update() {
    return this._update;
  }

  public set options(options: any) {
    if(options)
      if(!this._options) this._options = options;
      else this._options = {...this._options, ...options};
  }

  public get options(): any {
    return this._options;
  }

  public set select(select: string[]) {
    if (Array.isArray(select) && select.length) {
      let fields = {
        select: {}
      };
      for (let i = 0; i < select.length; i++) {
        fields.select[select[i]] = 1;
      }
      this.options = fields;
    }
  }

  public set newResponse(newResponse){
    if(newResponse) this.options = {new: true};
  }

  public set runValidators(runValidators){
    if(runValidators) this.options = {runValidators: true};
  }

  /**
   *
   * @param {object} update
   * @returns {object}
   *
   * Make a handler to create a pattern of update param.
   */
  private handlerSetUpdate(update: object): object {
    this.beforeSetUpdate(update);
    if (update.hasOwnProperty("$inc") || update.hasOwnProperty("$addToSet") || update.hasOwnProperty("$pull") || update.hasOwnProperty("$push") || update.hasOwnProperty("$set") || update.hasOwnProperty("$unset")) {
      return update;
    }
    return {$set: update};
  }

  /**
   *
   * @param update
   *
   * Remove the attribute id and _id, if the model pass in UpdateObject.
   */
  private beforeSetUpdate(update) {
    if (Array.isArray(update)) {
      for (let i = 0; i < update.length; i++) {
        delete update[i].id;
        delete update[i]._id;
      }
    } else {
      delete update.id;
      delete update._id;
    }
  }

}