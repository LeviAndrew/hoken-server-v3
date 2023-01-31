import {BaseUtil,Populate} from './BaseUtil';

interface Pagination {
  nextPage: number,
  limit: number,
}

interface OrderBy {
  asc: string[],
  desc: string[],
}

interface QueryData {
  query?: object | string,
  select?: string,
  populate?: Populate[],
  pagination?: Pagination,
  orderBy?: OrderBy,
  findOne?: boolean,
}

export class FindObject extends BaseUtil{
  private _limit: number;
  private _select: string;
  private _skip: number;
  private _sort: object;
  private _collation: object;
  private _findOne: boolean;

  constructor(data: QueryData) {
    super();
    if (data.pagination) this.setPagination(data.pagination);
    if (data.orderBy) this.setOrderBy(data.orderBy);
    this.findOne = data.findOne ? data.findOne : false;
    this.query = data.query ? data.query : {};
    this.select = data.select;
    this.populate = data.populate;
  };

  public set query(query: object | string) {
    if (typeof query === "string") {
      this.id = query;
      this.findOne = false;
    } else {
      this._query = {...this._query, ...query};
    }
  }

  public get query(): object | string {
    return this._query;
  }

  private get sort(): object {
    return this._sort;
  }

  private set sort(sort: object) {
    this._sort = sort;
  }

  private get collation(): object {
    return this._collation;
  }

  private set collation(collation: object) {
    this._collation = collation;
  }

  private set limit(limit: number) {
    this._limit = limit;
  }

  private get limit(): number {
    return this._limit;
  }

  private set skip(skip: number) {
    this._skip = skip;
  }

  private get skip(): number {
    return this._skip;
  }

  private set select(select: string) {
    this._select = select;
  }

  private get select(): string {
    return this._select;
  }

  private set findOne(findOne: boolean){
    this._findOne = findOne;
  }

  private get findOne():boolean{
    return this._findOne;
  }

  /**
   *
   * @param {Pagination} pagination
   *
   * Configura a paginação.
   */
  private setPagination(pagination: Pagination) {
    this.skip = (pagination.nextPage - 1) * pagination.limit;
    this.limit = pagination.limit;
  }

  /**
   *
   * @param {OrderBy} orderBy
   *
   * Configura a order.
   */
  private setOrderBy(orderBy: OrderBy){
    let sortObj = {};
    for(let i = 0; i < orderBy.asc.length; i++){
      sortObj[orderBy.asc[i]] = 1;
    }
    for(let i = 0; i < orderBy.desc.length; i++){
      sortObj[orderBy.desc[i]] = -1;
    }
    this.sort = sortObj;
    this.collation = {locale: 'pt', strength: 2};
  }

}