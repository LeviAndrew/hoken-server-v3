import {BaseUtil} from './BaseUtil';

interface QueryData {
  query: object | string,
}

export class QueryObject extends BaseUtil {

  constructor(data: QueryData) {
    super();
    this.query = data.query;
  };

}