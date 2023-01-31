import {BasicHandler} from "../BasicHandler";
import {FindObject} from "../util/FindObject";

export class Download extends BasicHandler {

  public async entitiesToXLSX (param: defaultParam<entitiesId>) {
    let required = this.attributeValidator([
      "auth", "aKey", "data", ["ids"]
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const entities = await this.getEntitiesToXLSX(param.data);
      const entitiesToXLSX = await this.sendToServer('db.entity.read', new FindObject({
        query: {
          _id: {
            $in: entities,
          },
          activate: true,
        },
        select: 'name firstName visible'
      }));
      this.checkHubReturn(entitiesToXLSX.data);
      const entitiesDataSet = entitiesToXLSX.data.success.map(entity => {
        return {
          APELIDO: entity.firstName ? entity.firstName : "",
          NOME: entity.name,
          VISIVEL: entity.visible ? 'SIM' : 'NÃO',
        }
      });
      return await this.returnHandler({
        model: 'entity',
        data: {
          success: {
            title: 'entities',
            dataset: entitiesDataSet
          }
        },
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'entity',
        data: {error: e.message || e},
      });
    }
  }

  private async getEntitiesToXLSX (param: { ids: any }) {
    let ids = new Set();
    const entities = await this.sendToServer('db.entity.read', new FindObject({
      query: {
        _id: {
          $in: param.ids
        },
        activate: true,
      },
      select: 'id _id parents children'
    }));
    let children = [];
    if(!entities.data.error && entities.data.success) {
      for (let i = 0; i < entities.data.success.length; i++) {
        ids.add(entities.data.success[i].id);
        entities.data.success[i].parents.forEach(parent => {
          ids.add(parent.toString());
        });
        children = [...children, ...entities.data.success[i].children];
      }
    }
    if(children.length) {
      const childrenIds = await this.getEntitiesToXLSX({ids: children});
      childrenIds.forEach(child => {
        ids.add(child);
      });
    }
    return [...ids];
  }

}

export default new Download();

interface defaultParam<T> {
  auth: string,
  aKey: string,
  data: T,
}

interface entitiesId {
  ids: [string],
}