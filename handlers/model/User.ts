import {BasicHandler} from "../BasicHandler";
import {FindObject} from "../util/FindObject";
import {UpdateObject} from "../util/UpdateObject";
import {Types} from "mongoose";

export class User extends BasicHandler {

  public async logout (param: logoutParam) {
    let required = this.attributeValidator(['auth', "aKey"], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let ret = await this.sendToServer('accessSession.removeKey', {
        authenticationKey: param.auth,
        accessKey: param.aKey,
      });
      return await this.returnHandler({
        model: 'user',
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      })
    }
  }

  public async updatePassword (param: changePassword) {
    let required = this.attributeValidator([
      'auth', 'currentPassword', 'newPassword'
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let userId: string = await this.getUserIdByAuth(param.auth);
      let checkPassword = await this.sendToServer('db.user.verifyPassword', {
        password: param.currentPassword,
        userId
      });
      if(!checkPassword.data.success || checkPassword.data.error) return await this.returnHandler({
        model: 'user',
        data: {error: 'invalidPassword'}
      });
      let ret = await this.sendToServer('db.user.update', new UpdateObject({
        query: userId,
        update: {
          password: param.newPassword,
        },
      }));
      let data = {success: null, error: null};
      if(!ret.data.success || ret.data.error) data.error = 'weCantUpdatePassword';
      else data.success = !!ret.data.success;
      return await this.returnHandler({
        model: 'user',
        data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async entitiesRead (param: defaultParam) {
    let required = this.attributeValidator([
      'auth'
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const userEntitiesRet = await Promise.all([
        this.sendToServer('db.user.aggregate', [
          {$match: {authenticationKey: param.auth}},
          {$project: {entities: 1}},
          {
            $lookup: {
              from: "entities",
              localField: "entities.entity",
              foreignField: "_id",
              as: "entities"
            }
          },
          {$unwind: "$entities"},
          {$replaceRoot: {newRoot: "$entities"}},
          {$match: {$and: [{visible: true}, {removed: false}]}},
          {$project:{_id: 1, id: 1, name: 1, children: 1, firstName: 1}},
        ]),
        this.sendToServer('db.user.read', new FindObject({
          findOne: true,
          query: {
            authenticationKey: param.auth,
          },
          select: 'entities',
          populate: [
            {
              path: 'entities.privileges',
              select: '_id id actions label',
              populate: [
                {
                  path: 'actions',
                  select: '_id id methods label name'
                }
              ]
            }
          ]
        })),
      ]);
      for (let i = 0; i < userEntitiesRet.length; i++) {
        this.checkHubReturn(userEntitiesRet[i].data);
      }
      const userEntitiesMap = new Map(userEntitiesRet[0].data.success.map(entity => [entity.id, entity]));
      let ret = [];
      let mainEntities = [];
      for (let i = 0; i < userEntitiesRet[1].data.success.entities.length; i++) {
        if(userEntitiesMap.has(userEntitiesRet[1].data.success.entities[i].entity.toString())) {
          ret.push({
            // @ts-ignore
            ...userEntitiesMap.get(userEntitiesRet[1].data.success.entities[i].entity.toString()),
            ...{privileges: userEntitiesRet[1].data.success.entities[i].privileges},
          });
          mainEntities.push({
            privilege: userEntitiesRet[1].data.success.entities[i].privileges.id,
            entityId: userEntitiesRet[1].data.success.entities[i].entity.toString(),
          });
        }
      }
      const updateSession = await this.sendToServer('db.session.update', new UpdateObject({
        query: param.auth,
        update: {
          mainEntities
        }
      }));
      this.checkHubReturn(updateSession.data);
      return await this.returnHandler({
        model: 'user',
        data: {success: ret},
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async entityChildrenRead (param: entityChildren) {
    let required = this.attributeValidator([
      'auth', 'entityId'
    ], param);
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const entityChildrenRet = await Promise.all([
        this.sendToServer('db.entity.aggregate', [
          // @ts-ignore
          {$match: {_id: new Types.ObjectId(param.entityId)}},
          {$project: {children: 1}},
          {
            $lookup: {
              from: "entities",
              localField: "children",
              foreignField: "_id",
              as: "children"
            }
          },
          {$unwind: "$children"},
          {$replaceRoot: {newRoot: "$children"}},
          {$match: {$and: [{visible: true}, {removed: false}]}},
          {$project: {_id: 1, id: 1, name: 1, children: 1, firstName: 1}},
        ]),
        this.sendToServer('db.session.read', new FindObject({
          query: param.auth,
        })),
      ]);
      for (let i = 0; i < entityChildrenRet.length; i++) {
        this.checkHubReturn(entityChildrenRet[i].data);
      }
      let mainEntitiesMap = new Map();

      for (let i = 0; i < entityChildrenRet[1].data.success.mainEntities.length; i++) {
        mainEntitiesMap.set(entityChildrenRet[1].data.success.mainEntities[i].entityId.toString(),
          new Set(entityChildrenRet[1].data.success.mainEntities[i].mappedChildren.map(childId => childId.toString()))
        )
      }
      if(mainEntitiesMap.has(param.entityId)) {
        for (let i = 0; i < entityChildrenRet[0].data.success.length; i++) {
          mainEntitiesMap.get(param.entityId).add(entityChildrenRet[0].data.success[i].id);
        }
      } else {
        for (let [entity, children] of mainEntitiesMap.entries()) {
          if(children.has(param.entityId)) {
            for (let i = 0; i < entityChildrenRet[0].data.success.length; i++) {
              mainEntitiesMap.get(entity).add(entityChildrenRet[0].data.success[i].id);
            }
          }
        }
      }
      let toUpdate = [];
      for (let i = 0; i < entityChildrenRet[1].data.success.mainEntities.length; i++) {
        toUpdate.push({
          privilege: entityChildrenRet[1].data.success.mainEntities[i].privilege,
          entityId: entityChildrenRet[1].data.success.mainEntities[i].entityId,
          mappedChildren: [...mainEntitiesMap.get(entityChildrenRet[1].data.success.mainEntities[i].entityId.toString())],
        })
      }
      const sessionUpdate = await this.sendToServer('db.session.update', new UpdateObject({
        query: param.auth,
        update: {
          mainEntities: toUpdate,
        }
      }));
      this.checkHubReturn(sessionUpdate.data);
      return await this.returnHandler({
        model: 'user',
        data: entityChildrenRet[0].data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      });
    }
  }

  public async getSetting(param: defaultParam) {
    const model = 'user',
      required = this.attributeValidator([
        'auth',
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        userId: string = await this.getUserIdByAuth(param.auth),
        promises = await Promise.all([
          this.sendToServer('db.user.read', new FindObject({
            query: userId,
            select: 'id userSettings',
            populate: [
              {
                path: 'userSettings',
              }
            ]
          })),
          this.sendToServer('db.setting.read', new FindObject({
            findOne: true,
            query: {
              isDefault: true,
            },
          })),
        ]);
      for (let i = 0; i < promises.length; i++) {
        if (!promises[i].data.success || promises[i].data.error) return await this.returnHandler({
          model,
          data: {error: 'readError'}
        });
      }
      let
        ret = promises[0].data.success;
      if (!ret.userSettings) ret['userSettings'] = promises[1].data.success;
      return await this.returnHandler({
        model,
        data: {success: ret},
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async createUpdateUserSettings(param: createUpdateUserSettings) {
    const model = 'user',
      required = this.attributeValidator([
        'auth', 'data',
        [
          "async", "hasTimer", "time", 'weekAmount', 'demands'
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      delete param.data.playersPerTeam;
      if (param.data.weekAmount > param.data.demands.length) {
        const diff = param.data.weekAmount - param.data.demands.length,
          diffDemands = [];
        for (let i = 0; i < diff; i++) {
          diffDemands.push(0);
        }
        param.data.demands = [...param.data.demands, ...diffDemands];
      }
      const userId: string = await this.getUserIdByAuth(param.auth),
        user = await this.sendToServer('db.user.read', new FindObject({
          query: userId,
          select: 'id userSettings',
        }));
      if (!user.data.success || user.data.error) return await this.returnHandler({
        model,
        data: {error: "invalidUser"}
      });
      let ret = null;
      if (!user.data.success.userSettings) {
        const userSettings = await this.sendToServer('db.setting.create', {
            async: param.data.async,
            timer: param.data.hasTimer,
            time: param.data.time,
            demands: param.data.demands,
            weekAmount: param.data.weekAmount,
          });
        if (!userSettings.data.success || userSettings.data.error) return await this.returnHandler({
          model,
          data: {error: "createError"}
        });
        const updatedUser = await this.sendToServer('db.user.update', new UpdateObject({
            query: userId,
            update: {
              userSettings: userSettings.data.success[0].id,
            }
          }));
        if (!updatedUser.data.success || updatedUser.data.error) {
          await this.sendToServer('db.setting.delete', new FindObject({
            query: userSettings.data.success.id,
          }));
          return await this.returnHandler({
            model,
            data: {error: 'cantUpdateUser'}
          });
        }
        ret = userSettings.data.success[0];
      } else {
        const updatedSetting = await this.sendToServer('db.setting.update', new UpdateObject({
            query: user.data.success.userSettings.toString(),
            update: {
              async: param.data.async,
              timer: param.data.hasTimer,
              time: param.data.time,
              demands: param.data.demands,
              weekAmount: param.data.weekAmount,
            }
          }));
        if (!updatedSetting.data.success || updatedSetting.data.error) return await this.returnHandler({
          model,
          data: {error: 'cantUpdateSetting'}
        });
        ret = updatedSetting.data.success;
      }
      return await this.returnHandler({
        model,
        data: {success: ret},
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async deleteSetting(param: defaultParam) {
    const model = 'user',
      required = this.attributeValidator([
        'auth',
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const userId: string = await this.getUserIdByAuth(param.auth),
        user = await this.sendToServer('db.user.read', new FindObject({
          query: userId,
          select: 'id userSettings',
        }));
      if (!user.data.success || user.data.error) return await this.returnHandler({
        model,
        data: {error: 'cantReadUser'}
      });
      const updatedUser = await this.sendToServer('db.user.update', new UpdateObject({
          query: userId,
          update: {
            userSettings: null,
          }
        }));
      if (!updatedUser.data.success || updatedUser.data.error) return await this.returnHandler({
        model,
        data: {error: 'cantUpdateUser'}
      });
      const ret = await this.sendToServer('db.setting.delete', new FindObject({query: user.data.success.userSettings.toString()}));
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async createGame(param: {auth: string, data: any}) {
    const model = 'user',
      required = this.attributeValidator([
        'auth', 'data',
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const userId: string = await this.getUserIdByAuth(param.auth),
        ret = await this.basicCreateGame(userId, param.data);
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async getGame(param: {auth: string, data: any}) {
    const model = 'user',
      required = this.attributeValidator([
        'auth',
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const userId: string = await this.getUserIdByAuth(param.auth),
        ret = await this.sendToServer('db.game.read', new FindObject({
          findOne: true,
          query: {
            teacher: userId,
            gameStatus: {
              $ne: 'finished',
            },
          },
          select: 'pin gameStatus gameSetting._id gameSetting.async' +
            ' gameSetting.timer gameSetting.time teams id',
        }));
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async updateInfo(param: updateInfo) {
    const model = 'user',
      canUpdate = [
        "name", "surname", "email", "educationalInstitution"
      ],
      required = this.attributeValidator([
        'auth', 'data', '$or', canUpdate,
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const userId: string = await this.getUserIdByAuth(param.auth),
        ret = await this.sendToServer('db.user.update', new UpdateObject({
          query: userId,
          update: this.getUpdateObject(canUpdate, param.data),
          select: [...canUpdate, 'id']
        }));
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async getAvailableReports(param: {auth: string, data: any}) {
    const model = 'user',
      required = this.attributeValidator([
        'auth',
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const userId: string = await this.getUserIdByAuth(param.auth),
        ret = await this.sendToServer('db.game.read', new FindObject({
          query: {
            teacher: userId,
            gameStatus: 'finished',
          },
          select: 'id createdAt',
          orderBy: {
            asc: [],
            desc: ['createdAt'],
          }
        }));
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async readGameDetail(param: {auth: string, data: {id: string}}) {
    const model = 'user',
      required = this.attributeValidator([
        'auth', 'data',
        [
          'id',
        ],
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const ret = await this.sendToServer('db.game.read', new FindObject({
          query: param.data.id,
          select: 'gameSetting teacher teams id',
          populate: [
            {
              path: 'teacher',
              select: 'name surname id',
            },
          ],
        }));
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async readCurrentGame(param: {auth: string, data: {id: string}}) {
    const model = 'user',
      required = this.attributeValidator([
        'auth', 'data',
        [
          'id',
        ],
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const ret = await this.sendToServer('db.game.read', new FindObject({
          query: param.data.id,
          select: 'teams',
        }));
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async jsonToXLSX(param: {auth: string, data: {id: string}}) {
    const model = 'user',
      required = this.attributeValidator([
        'auth', 'data',
        [
          'id',
        ],
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const ret = await this.sendToServer('db.game.read', new FindObject({
          query: param.data.id,
          select: 'gameSetting teams id',
        }));
      const objectBase = function ({
                                 teamNick,
                                 position,
                                 participantName,
                                 week,
                                 estoqueInicial,
                                 recebimentoMercadori,
                                 estoqueDisponivel,
                                 recebimentoPedido,
                                 entregaMercadoria,
                                 pendencia,
                                 estoqueFinal,
                                 custo,
                                 custoTotal,
                                 decisao,
                               }: {
          teamNick?,
          position?,
          participantName?,
          week?,
          estoqueInicial?,
          recebimentoMercadori?,
          estoqueDisponivel?,
          recebimentoPedido?,
          entregaMercadoria?,
          pendencia?,
          estoqueFinal?,
          custo?,
          custoTotal?,
          decisao?,
        }) {
          return {
            "Grupo": teamNick || "",
            "Posição": position || "",
            "Participante": participantName || "",
            "Semana": week || "",
            "Estoque inicial": estoqueInicial || "",
            "Recebimento de mercadoria": recebimentoMercadori || "",
            "Estoque disponivel": estoqueDisponivel || "",
            "Recebimento de pedido": recebimentoPedido || "",
            "Entrega de mercadoria": entregaMercadoria || "",
            "Pendencia": pendencia || "",
            "Estoque final": estoqueFinal || "",
            "Custo": custo || "",
            "Custo total": custoTotal || "",
            "Decisão": decisao || "",
          }
        },
        gameTypeTranslate = {
          industria: "Industria",
          distribuidor: "Distribuidor",
          atacadista: "Atacadista",
          varegista: "Varejista",
        },
        xlsxArray = [objectBase({})];
      ret.data.success.teams.forEach(team => {
        team.players.forEach(player => {
          player.playedArray.forEach((played, index) => {
            xlsxArray.push(objectBase({
              teamNick: team.nick,
              position: gameTypeTranslate[player.playerType],
              participantName: player.nick,
              week: index + 1,
              estoqueInicial: played.estoqueInicial || "0",
              recebimentoMercadori: played.recebimentoMercadori || "0",
              estoqueDisponivel: played.estoqueDisponivel || "0",
              recebimentoPedido: played.recebimentoPedido || "0",
              entregaMercadoria: played.entregaMercadoria || "0",
              pendencia: played.pendencia || "0",
              estoqueFinal: played.estoqueFinal || "0",
              custo: played.custo || "0",
              custoTotal: played.custoTotal || "0",
              decisao: played.decisao || "0",
            }));
          });
        });
        xlsxArray.push(objectBase({}));
      });
      xlsxArray.push(objectBase({teamNick: "Configurações do jogo"}));
      xlsxArray.push(objectBase({
        teamNick: "Total de semanas",
        position: ret.data.success.gameSetting.weekAmount,
      }));
      xlsxArray.push(objectBase({
        teamNick: "Jogo assincrono?",
        position: ret.data.success.gameSetting.async ? "SIM" : "NÃo",
      }));
      xlsxArray.push(objectBase({
        teamNick: "Jogo com tempo?",
        position: ret.data.success.gameSetting.timer ? `SIM ${ret.data.success.gameSetting.time} segundos` : "NÃo",
      }));
      return await this.returnHandler({
        model,
        data: {success: xlsxArray},
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

}

export default new User();

interface defaultParam {
  auth: string,
}

interface logoutParam extends defaultParam {
  aKey: string,
}

interface changePassword extends defaultParam {
  currentPassword: string,
  newPassword: string,
}

interface entityChildren extends defaultParam {
  entityId: string,
}
interface createUpdateUserSettings {
  auth: string,
  data: {
    async: boolean,
    hasTimer: boolean,
    time: number,
    playersPerTeam: number,
    weekAmount: number,
    demands: number[],
  }
}
interface updateInfo {
  auth: string,
  data: {
    name: string,
    surname: string,
    email: string,
    educationalInstitution: string,
  }
}
