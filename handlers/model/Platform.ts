import {BasicHandler} from "../BasicHandler";
import {FindObject} from "../util/FindObject";
import {Promise} from "mongoose";
import {Application} from "../../Application";
import {UpdateObject} from "../util/UpdateObject";

export class Platform extends BasicHandler {

    public async register(param: defaultParam<register>) {
      const
        model = 'user',
        required = this.attributeValidator([
          "pKey", "data", [
            "id", "educationalInstitution",
          ]
        ], param);
      if (!required.success) return await this.getErrorAttributeRequired(required.error);
      try {
        const apiSetting = (await this.sendToServer('db.apiSetting.read', new FindObject({
            findOne: true,
            query: {
              apiKey: param.pKey
            }
          }))).data.success;
        if (!apiSetting) return await this.returnHandler({
          model,
          data: {error: 'invalidApiSetting'}
        });
        const ret = await this.sendToServer('db.user.update', new UpdateObject({
            query: param.data.id,
            update: {
                platformKey: apiSetting.apiKey,
                educationalInstitution: param.data.educationalInstitution
            },
            select: ['userType', 'id', 'name', 'surname', 'email', 'educationalInstitution', 'platformKey'],
          }));
        this.checkHubReturn(ret.data);
        return await this.returnHandler({
          model,
          data: ret.data,
        });
      } catch (e) {
        return await this.returnHandler({
          model,
          data: {error: e.message || e},
        })
      }
    }

    public async createGame(param: defaultParam<{ teams: any[] }>) {
      const model = 'user',
        required = this.attributeValidator([
          "pKey", "userId", "data",
          [
            'teams',
          ]
        ], param);
      if (!required.success) return await this.getErrorAttributeRequired(required.error);
      try {
        if (param.data.teams.length < 2) return await this.returnHandler({
          model,
          data: {error: 'invalidTeamsAmount'}
        });
        const promises = await Promise.all([
            this.sendToServer('db.apiSetting.read', new FindObject({
              findOne: true,
              query: {
                apiKey: param.pKey
              }
            })),
            this.sendToServer('db.user.read', new FindObject({
              findOne: true,
              query: {
                platformKey: param.pKey,
                _id: param.userId,
              }
            })),
          ]);
        for (let i = 0; i < promises.length; i++) {
          if (!promises[i].data.success || promises[i].data.error) return await this.returnHandler({
            model,
            data: {error: 'invalidUserOrAppKey'}
          });
        }
        const accessKey = await this.sendToServer('accessSession.create', promises[1].data.success.authenticationKey);
        if (accessKey.data.error) return await this.returnHandler({
          model,
          data: accessKey.data,
        });
        const initPlayed = Application.initialPlayed,
          groups = [];
        for (let i = 0; i < param.data.teams.length; i++) {
          let group = {
                nick: param.data.teams[i].name,
                players: [],
              };
          for (let p = 0; p < param.data.teams[i].players.length; p++) {
            group.players.push({
              nick: param.data.teams[i].players[p].nick,
              playerType: param.data.teams[i].players[p].playerType,
              pin: `${p + 1}${i + 1}`,
              playedArray: initPlayed,
            })
          }
          groups.push(group);
        }
        const ret = await this.basicCreateGame(param.userId, groups, true);
        if (!ret.data.success || ret.data.error) return await this.returnHandler({
          model,
          data: {error: 'cannotCreateGame'}
        });
        return await this.returnHandler({
          model,
          data: {
            success: {
              ...ret.data.success[0],
              authenticationKey: promises[1].data.success.authenticationKey,
              accessKey: accessKey.data.success,
            }
          },
        });
      } catch (e) {
        return await this.returnHandler({
          model,
          data: {error: e.message || e},
        })
      }
    }
  
    public async getAvailableReports(param: defaultParam<null>) {
      const model = 'user',
        required = this.attributeValidator([
          "pKey", "userId",
        ], param);
      if (!required.success) return await this.getErrorAttributeRequired(required.error);
      try {
        const promises = await Promise.all([
            this.sendToServer('db.apiSetting.read', new FindObject({
              findOne: true,
              query: {
                apiKey: param.pKey
              }
            })),
            this.sendToServer('db.user.read', new FindObject({
              findOne: true,
              query: {
                platformKey: param.pKey,
                _id: param.userId,
              }
            })),
          ]);
        for (let i = 0; i < promises.length; i++) {
          if (!promises[i].data.success || promises[i].data.error) return await this.returnHandler({
            model,
            data: {error: 'invalidUserOrAppKey'}
          });
        }
        const ret = await this.sendToServer('db.game.read', new FindObject({
            query: {
              teacher: param.userId,
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
        })
      }
    }
  
    public async readGameDetail(param: defaultParam<{ id: string }>) {
      const model = 'user',
        required = this.attributeValidator([
          "pKey", "userId", 'data',
          [
            'id',
          ]
        ], param);
      if (!required.success) return await this.getErrorAttributeRequired(required.error);
      try {
        const promises = await Promise.all([
            this.sendToServer('db.apiSetting.read', new FindObject({
              findOne: true,
              query: {
                apiKey: param.pKey
              }
            })),
            this.sendToServer('db.user.read', new FindObject({
              findOne: true,
              query: {
                platformKey: param.pKey,
                _id: param.userId,
              }
            })),
          ]);
        for (let i = 0; i < promises.length; i++) {
          if (!promises[i].data.success || promises[i].data.error) return await this.returnHandler({
            model,
            data: {error: 'invalidUserOrAppKey'}
          });
        }
        const ret = await this.sendToServer('db.game.read', new FindObject({
            findOne: true,
            query: {
              _id: param.data.id,
              teacher: param.userId,
            },
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
        })
      }
    }
  
    public async jsonToXLSX(param: defaultParam<{ id: string }>) {
      const model = 'user',
        required = this.attributeValidator([
          "pKey", "userId", 'data',
          [
            'id',
          ]
        ], param);
      if (!required.success) return await this.getErrorAttributeRequired(required.error);
      try {
        const promises = await Promise.all([
            this.sendToServer('db.apiSetting.read', new FindObject({
              findOne: true,
              query: {
                apiKey: param.pKey
              }
            })),
            this.sendToServer('db.user.read', new FindObject({
              findOne: true,
              query: {
                platformKey: param.pKey,
                _id: param.userId,
              }
            })),
          ]);
        for (let i = 0; i < promises.length; i++) {
          if (!promises[i].data.success || promises[i].data.error) return await this.returnHandler({
            model,
            data: {error: 'invalidUserOrAppKey'}
          });
        }
        const ret = await this.sendToServer('db.game.read', new FindObject({
            findOne: true,
            query: {
              _id: param.data.id,
              teacher: param.userId,
            },
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
        })
      }
    }

}

export default new Platform();

interface defaultParam<T> {
  pKey: string,
  userId?: string,
  data: T
}

interface register {
  id: string,
  educationalInstitution: string,
}