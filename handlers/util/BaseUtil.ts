export interface Populate {
  path: string,
  select?: string,
  deselect?: string,
  populate?: Populate[],
  model?: string
}

export class BaseUtil {
  protected _query: object = {removed: false};
  private _populate: Populate[];
  private _id: string;

  constructor() {};

  protected set id(id: string) {
    this.clear();
    this._id = id;
  }

  protected get id(): string {
    return this._id;
  }

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

  public set populate(populate: Populate[]) {
    if (populate) this._populate = this.handlerPopulate(populate);
  }

  public get populate(): Populate[] {
    return this._populate;
  }

  /**
   * Limpa os dados que são desnecessarios na busca pelo id.
   */
  protected clear() {
    delete this.query;
  }

  /**
   *
   * @param {Populate[]} populate
   * @returns {Populate[]}
   *
   * Ajusta o populate quando é chamando.
   */
  protected handlerPopulate(populate: Populate[]): Populate[] {
    if (!Array.isArray(populate)) populate = [populate];
    for (let i = 0; i < populate.length; i++) {
      if (populate[i].hasOwnProperty('select')) populate[i].select = 'id ' + populate[i].select;
      if (populate[i].hasOwnProperty('deselect')) populate[i].select = populate[i].deselect;
      if (populate[i].hasOwnProperty('populate')) populate[i].populate = this.handlerPopulate(populate[i].populate);
    }
    return populate;
  }
}