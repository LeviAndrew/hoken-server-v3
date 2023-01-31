import {BasicHandler} from "../BasicHandler";
import * as xlsx2json from 'xlsx2json';
import * as fs from "fs";
import {FindObject} from "../util/FindObject";
import {Types} from 'mongoose'
import {UpdateObject} from "../util/UpdateObject";

export class Upload extends BasicHandler {

  public async entitiesImport (param: defaultParam<dest>) {
    let required = this.attributeValidator([
      "auth", "aKey", "data", ['dest']
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    const filePath = `${param.data.dest}/${param.data.documentName}${param.data.extname}`;
    try {
      const {
        attributesMap,
        tableRows,
        parents,
      } = await this.extractTableElements(filePath);
      const parentsMap = await this.getParentsMap(parents);
      const entitiesToSave = this.getEntitiesToSave({
        attributesMap,
        tableRows,
        parentsMap,
      });
      fs.unlinkSync(filePath);
      const newEntities = await this.sendToServer('db.entity.create', entitiesToSave.toSave);
      this.checkHubReturn(newEntities.data);
      let parentsUpdatePromises = [];
      for (let [key, value] of entitiesToSave.parentsToUpdate.entries()) {
        parentsUpdatePromises.push(
          this.sendToServer('db.entity.update', new UpdateObject({
            query: key,
            update: {
              $addToSet: {
                children: [...value],
              }
            },
          }))
        )
      }
      await Promise.all(parentsUpdatePromises);
      return await this.returnHandler({
        model: 'entity',
        data: {
          success: true,
        },
      });
    } catch (e) {
      fs.unlinkSync(filePath);
      return await this.returnHandler({
        model: 'entity',
        data: {error: e.message || e},
      });
    }
  }

  public async usersImport (param: defaultParam<userDestData>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        'dest', "privilege"
      ]
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    const filePath = `${param.data.dest}/${param.data.documentName}${param.data.extname}`;
    try {
      const tableData = await this.extractUserTableElements(filePath);
      fs.unlinkSync(filePath);
      await this.checkEntitiesPermission([...tableData.entitiesSet], param.entityId);
      const users = await this.setUsersEntitiesId([...tableData.entitiesSet], [...tableData.usersMapRet.values()], param.data.privilege);
      const ret = await this.updateExistedUsers(users);
      let toUpEntities = ret.updated.map(item => {
        if(item.data.success) return item.data.success;
      });
      if(ret.toCreate.length) {
        const blocs = await this.createUserInBloc(ret.toCreate);
        let promises = [];
        for (let i = 0; i < blocs.length; i++) {
          promises.push(this.sendToServer('db.user.import', blocs[i]));
        }
        const resolvedPromises = await Promise.all(promises);
        for (let i = 0; i < resolvedPromises.length; i++) {
          this.checkHubReturn(resolvedPromises[i].data);
          toUpEntities = [...toUpEntities, ...resolvedPromises[i].data.success];
        }
      }
      const entitiesUp = await this.updateEntities(toUpEntities);
      for (let i = 0; i < entitiesUp.length; i++) {
        this.checkHubReturn(entitiesUp[i].data);
      }
      return await this.returnHandler({
        model: 'user',
        data: {
          success: true,
        },
      });
    } catch (e) {
      fs.unlinkSync(filePath);
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  private async updateEntities (users) {
    let entitiesUpMap = new Map();
    users.forEach(user => {
      user.entities.forEach(userEntity => {
        if(!entitiesUpMap.has(userEntity.entity.toString())) entitiesUpMap.set(userEntity.entity.toString(), []);
        entitiesUpMap.get(userEntity.entity.toString()).push(user.id);
      })
    });
    let entitiesUser = [];
    for (let [key, value] of entitiesUpMap.entries()) {
      entitiesUser.push({
        _id: key,
        update: {
          $addToSet: {
            users: [...value],
          }
        }
      })
    }
    return await this.setUserOnEntities(entitiesUser);
  }

  private async setUserOnEntities (entitiesUserMap) {
    const toUp = entitiesUserMap.splice(0, 100);
    let promises = [];
    toUp.forEach(up => {
      promises.push(this.sendToServer('db.entity.update', new UpdateObject({
        query: up._id,
        update: up.update,
      })));
    });
    let ret = await Promise.all(promises);
    if(entitiesUserMap.length) ret = [...ret, ...await this.setUserOnEntities(entitiesUserMap)];
    return ret;
  }

  private createUserInBloc (usersToCreate) {
    let bloc = [usersToCreate.splice(0, 100)];
    if(usersToCreate.length) bloc = [...bloc, ...this.createUserInBloc(usersToCreate)];
    return bloc;
  }

  private async updateExistedUsers (users) {
    let
      emails = [],
      matriculations = [],
      documentNumbers = [];
    users.forEach(user => {
      emails.push(user.email);
      matriculations.push(user.matriculation);
      documentNumbers.push(user.document.documentNumber);
    });
    const usersCreated = await this.sendToServer('db.user.read', new FindObject({
      query: {
        $or: [
          {
            email: {
              $in: emails,
            }
          },
          {
            matriculation: {
              $in: matriculations,
            }
          },
          {
            'document.documentNumber': {
              $in: documentNumbers,
            }
          }
        ]
      },
      select: 'id email document matriculation entities'
    }));
    if(usersCreated.data.error) throw new Error('weCantReadUsers');
    let ret = {
      toCreate: [],
      updated: [],
    };
    if(usersCreated.data.success.length) {
      let userByEmail = new Map();
      let userByDocumentNumber = new Map();
      let userByMatriculation = new Map();
      usersCreated.data.success.forEach(user => {
        userByEmail.set(user.email, user);
        userByDocumentNumber.set(user.document.documentNumber, user);
        userByMatriculation.set(user.matriculation, user);
      });
      let updateObjects = [];
      let usersToRet = users.filter(user => {
        if(userByEmail.has(user.email)) {
          updateObjects.push(this.updateUserEntities(user.entities, userByEmail.get(user.email)));
          return false;
        } else if(userByMatriculation.has(user.matriculation)) {
          updateObjects.push(this.updateUserEntities(user.entities, userByMatriculation.get(user.matriculation)));
          return false;
        } else if(userByDocumentNumber.has(user.document.documentNumber)) {
          updateObjects.push(this.updateUserEntities(user.entities, userByDocumentNumber.get(user.document.documentNumber)));
          return false;
        }
        return true;
      });
      ret.updated = await this.handlerUpdateUsers(updateObjects);
      ret.toCreate = usersToRet;
    } else {
      ret.toCreate = users;
    }
    return ret;
  }

  private async handlerUpdateUsers (usersToUp) {
    const toUp = usersToUp.splice(0, 100);
    let promises = [];
    toUp.forEach(up => {
      if(up) {
        promises.push(this.sendToServer('db.user.update', new UpdateObject({
          query: up.id,
          update: up.update,
        })));
      }
    });
    const promisesResolved = await Promise.all(promises);
    let rest = [];
    if(usersToUp.length) rest = await this.handlerUpdateUsers(usersToUp);
    return [...promisesResolved, ...rest];
  }

  private updateUserEntities (newEntities, user) {
    const currentEntitiesMap = new Map(user.entities.map(userEntity => {
      return [userEntity.entity.toString(), userEntity];
    }));
    let update = false;
    newEntities.forEach(userEntity => {
      if(!currentEntitiesMap.has(userEntity.entity)) {
        currentEntitiesMap.set(userEntity.entity, userEntity);
        update = true;
      }
      if(currentEntitiesMap.has(userEntity.entity &&
        // @ts-ignore
        currentEntitiesMap.get(userEntity.entity).privileges.toString() !== userEntity.privileges)) {
        // @ts-ignore
        currentEntitiesMap.get(userEntity.entity) = userEntity;
        update = true;
      }
    });
    return update && {
      id: user.id,
      update: {entities: [...currentEntitiesMap.values()]}
    };
  }

  private async setUsersEntitiesId (entitiesName, users, privilege: string) {
    const entities = await this.sendToServer('db.entity.read', new FindObject({
      query: {
        name: {
          $in: entitiesName,
        }
      },
      select: '_id id name'
    }));
    this.checkHubReturn(entities.data);
    const entitiesMap = new Map(entities.data.success.map(entity => {
      return [entity.name, entity.id];
    }));
    const date = new Date().getTime();
    return users.map(user => {
      let userEntities = [];
      user.entities.forEach(entity => {
        if(entitiesMap.get(entity)) userEntities.push({
          entity: entitiesMap.get(entity),
          privileges: privilege,
          date,
        })
      });
      user.entities = userEntities;
      return user;
    });
  }

  private async checkEntitiesPermission (entitiesName: any, entityId: string) {
    const promises = await Promise.all([
      this.readEntityTree([entityId]),
      this.sendToServer('db.entity.read', new FindObject({
        query: {
          name: {
            $in: entitiesName,
          }
        },
        select: '_id id'
      }))
    ]);
    this.checkHubReturn(promises[1].data);
    const {
      success
    } = promises[1].data;
    for (let i = 0; i < success.length; i++) {
      if(!promises[0].has(success[i].id)) throw new Error('hasEntityUnauthorized');
    }
  }

  private async extractUserTableElements (filePath: string) {
    const [table] = await xlsx2json(filePath);
    const [tableHeader, ...rows] = table;
    let attributesMap = new Map();
    for (let attr in tableHeader) {
      if(tableHeader.hasOwnProperty(attr)) {
        attributesMap.set(tableHeader[attr], attr);
      }
    }
    let entitiesSet = new Set();
    let usersMap = new Map();
    for (let i = 0; i < rows.length; i++) {
      if(!usersMap.has(rows[i][attributesMap.get('matriculation')])) {
        const user = this.handleUser(attributesMap, rows[i]);
        if(user) usersMap.set(rows[i][attributesMap.get('matriculation')], user);
      } else usersMap.get(rows[i][attributesMap.get('matriculation')]).entities.push(rows[i][attributesMap.get('entity')]);
      entitiesSet.add(rows[i][attributesMap.get('entity')]);
    }
    let usersMapByDocumentNumber = new Map();
    for (let user of usersMap.values()) {
      if(usersMapByDocumentNumber.has(user.document.documentNumber)) {
        let currentEntities = usersMapByDocumentNumber.get(user.document.documentNumber).entities;
        user.entities = [...user.entities, ...currentEntities];
      }
      usersMapByDocumentNumber.set(user.document.documentNumber, user);
    }
    let usersMapRet = new Map();
    for (let user of usersMap.values()) {
      if(usersMapRet.has(user.email)) {
        let currentEntities = usersMapRet.get(user.email).entities;
        user.entities = [...user.entities, ...currentEntities];
      }
      usersMapRet.set(user.email, user);
    }
    return {
      entitiesSet,
      usersMapRet,
    };
  }

  private handleUser (attributesMap, row) {
    const rowData = {
      documentNumber: row[attributesMap.get('document')],
      documentType: row[attributesMap.get('document_type')],
      name: row[attributesMap.get('name')],
      email: row[attributesMap.get('email')],
      matriculation: row[attributesMap.get('matriculation')],
      entity: row[attributesMap.get('entity')],
    };
    if(!rowData.email || !rowData.documentNumber || !rowData.matriculation) return false;
    let documentType = null;
    if(rowData.documentType.toLowerCase() === 'passport') documentType = "passport";
    else if(rowData.documentType.toLowerCase() === 'rg') documentType = "RG";
    else documentType = "CPF";
    const splitName = rowData.name.split(" ");
    const name = splitName[0];
    let surname = "";
    for (let i = 1; i < splitName.length; i++) {
      if(splitName[i]) surname = `${surname} ${splitName[i]}`;
    }
    return {
      name,
      surname,
      email: rowData.email,
      password: "123456",
      matriculation: rowData.matriculation,
      document: {
        documentType,
        documentNumber: rowData.documentNumber,
      },
      entities: [
        rowData.entity,
      ]
    };
  }

  private async extractTableElements (filePath: string) {
    const [table] = await xlsx2json(filePath);
    const [tableHeader, ...rows] = table;
    let attributesMap = new Map();
    attributesMap.set('parents', []);
    for (let attr in tableHeader) {
      if(tableHeader.hasOwnProperty(attr)) {
        if(tableHeader[attr] !== 'parent') attributesMap.set(tableHeader[attr], attr);
        else if(tableHeader[attr] === 'parent') attributesMap.get('parents').push(attr);
      }
    }
    const parentsAttribute = attributesMap.get('parents');
    let parentsSet = new Set();
    for (let row of rows) {
      for (let i = 0; i < parentsAttribute.length; i++) {
        if(row[parentsAttribute[i]]) parentsSet.add(row[parentsAttribute[i]].trim());
      }
    }
    const rowsMap = new Map(rows.map(row => {
      return [row[attributesMap.get('name')], row];
    }));
    const tableRows = [...rowsMap.values()];
    return {
      attributesMap,
      tableRows,
      parents: [...parentsSet],
    }
  }

  private async getParentsMap (param) {
    const entitiesRet = await this.sendToServer('db.entity.read', new FindObject({
      query: {
        name: {
          $in: param,
        }
      },
      select: "name id"
    }));
    if(!entitiesRet.data.success) throw new Error('weCantReadEntitiesParents');
    if(entitiesRet.data.error) throw entitiesRet.data.error;
    if(param.length > entitiesRet.data.success.length) {
      const entitiesDb = new Set(entitiesRet.data.success.map(entity => {
        return entity.name
      }));
      let notFound = new Set(param.filter(entity => {
        if(entity && !entitiesDb.has(entity)) {
          return entity;
        }
      }));
      throw new Error(`parentsNotFound => ${[...notFound]}`);
    }
    return new Map(entitiesRet.data.success.map(entity => {
      return [entity.name, entity.id];
    }));
  }

  private getEntitiesToSave (param: { attributesMap: any, tableRows: any, parentsMap: any, }) {
    let toSave = [];
    let parentsToUpdate = new Map();
    const parentsAttribute = param.attributesMap.get('parents');
    for (let entity of param.tableRows) {
      const id = new Types.ObjectId().toString();
      let entityToPush = {
        _id: id,
        name: entity[param.attributesMap.get('name')],
        firstName: entity[param.attributesMap.get('first_name')],
        parents: []
      };
      if(entity[param.attributesMap.get('initial_date')] || entity[param.attributesMap.get('end_date')]) {
        const date = this.dateValidator({
          initialDate: entity[param.attributesMap.get('initial_date')],
          endDate: entity[param.attributesMap.get('end_date')],
        });
        entityToPush = {...entityToPush, ...date};
      }
      for (let i = 0; i < parentsAttribute.length; i++) {
        const
          parentName = entity[parentsAttribute[i]].trim();
        if(parentName) {
          if(!parentsToUpdate.has(param.parentsMap.get(parentName)))
            parentsToUpdate.set(param.parentsMap.get(parentName), new Set());
          parentsToUpdate.get(param.parentsMap.get(parentName)).add(id);
          entityToPush.parents.push(
            param.parentsMap.get(parentName),
          )
        }
      }
      toSave.push(entityToPush);
    }
    return {
      toSave,
      parentsToUpdate,
    };
  }

  private dateValidator (param: { initialDate: string, endDate: string }) {
    const initialDate = param.initialDate ? this.dateFormat(param.initialDate) : null;
    const endDate = param.endDate ? this.dateFormat(param.endDate) : null;
    if(endDate) {
      return this.handleEndDate({
        initialDate,
        endDate,
      });
    }
    this.checkInitialDate(initialDate);
    return {
      initialDate,
    }
  }

  private handleEndDate (param: { initialDate: number, endDate: number }) {
    const currentDate = new Date().getTime();
    if(param.endDate < (currentDate + 86400000)) throw new Error('endDateMustBeGreaterThan24Hours');
    if(param.initialDate) {
      this.checkInitialDate(param.initialDate);
      if(param.initialDate >= param.endDate) throw new Error('endDateMustBeGreaterThanInitialDate');
      return {
        initialDate: param.initialDate,
        endDate: param.endDate,
      }
    }
    return {
      activate: true,
      endDate: param.endDate,
    };
  }

  private checkInitialDate (initialDate: number) {
    const currentDate = new Date().getTime();
    if(initialDate < (currentDate + 43200000)) throw new Error('initialDateMustBeGreaterThan12Hours');
  }

  private dateFormat (date: string) {
    const fullYear = JSON.stringify(new Date().getFullYear());
    const dateArr = date.split('/');
    const day = Number(dateArr[1]);
    const month = Number(dateArr[0]) - 1;
    const year = Number(`${fullYear.slice(0, 2)}${dateArr[2]}`);
    return new Date(year, month, day).getTime();
  }

}

export default new Upload();

interface defaultParam<T> {
  auth: string,
  aKey: string,
  entityId?: string,
  data: T,
}

interface documentName {
  extname: string,
  documentName: string,
}

interface dest extends documentName {
  dest: string,
}

interface userDestData extends dest {
  privilege: string,
}