import {BasicHandler} from "../BasicHandler";
import {FindObject} from '../util/FindObject';
import {UpdateObject} from "../util/UpdateObject";
import {Application} from '../../Application';
import { cpf } from 'cpf-cnpj-validator'; 
import {Types} from "mongoose";
import * as ldap from 'ldapjs';
import * as path from 'path';

export class OpenHandler extends BasicHandler {

  public async getLocale (data) {
    let dataLocale = Application.getPathI18N();
    let i18n = data.i18n ? data.i18n : dataLocale.defaultI18N;
    let ret = await this.getI18N({path: path.resolve(`${dataLocale.mainPath}/${i18n}/${dataLocale.i18n}`)});
    return await this.returnHandler({
      model: 'global',
      data: ret
    })
  }

  public async loginHoken (data: loginData): Promise<returnData> {
    let required = this.attributeValidator(['login', 'password'], data), ret;
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      ret = await this.sendToServer('db.user.login', {
        password: data.password,
        queryObject: new FindObject({
          query: {
            $or:[
              {
                email: data.login,
              },
              {
                'document.documentNumber': data.login,
              },
              {
                matriculation: data.login,
              },
            ],
            removed: false,
          },
          select: 'id name surname email birthday matriculation document authenticationKey drive.canUpdate',
        }),
      });
      if(ret.data.error && ret.data.error !== 'userNotFound') {
        if(cpf.isValid(data.login)) {
          const userLdapSetic:any = await this.authenticate(data.login, data.password);
          if (userLdapSetic.success) {
            ret = await this.sendToServer('db.user.login', {
              password: 'ldap',
              queryObject: new FindObject({
                query: {
                  $or:[
                    {
                      email: data.login,
                    },
                    {
                      'document.documentNumber': data.login,
                    },
                    {
                      matriculation: data.login,
                    },
                  ],
                  removed: false,
                },
                select: 'id name surname email birthday matriculation document authenticationKey drive.canUpdate',
              }),
            });
            if(ret.data.error) throw new Error('emailOrPasswordInvalid');
          } else throw new Error('emailOrPasswordInvalid');
        } else throw new Error('emailOrPasswordInvalid');
      }
      if(ret.data.error && !cpf.isValid(data.login) || ret.data.error === 'userNotFound') throw new Error('emailOrPasswordInvalid');
      let accessKey = await this.sendToServer('accessSession.create', ret.data.success.authenticationKey);
      if(accessKey.data.error) return await this.returnHandler({
        model: 'user',
        data: accessKey.data,
      });
      ret.data.success.accessKey = accessKey.data.success;
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

  public authenticate (cn, password) {
    return new Promise((resolve, reject) => {
      let client, dn = 'sysacc-labtic', senha = 'A6UW$WU4!<TCUa--@(A$Q-_Ke_y9xNz7FpqUCbE)q#cMSvNW+G';
      try {
        client = ldap.createClient({
          url: 'ldap://dc-02-reitoria.corp.udesc.br',
          reconnect: true,
        });
      } catch (e) {
        resolve({error: e});
      }
      try {
        client.bind(dn, senha, (err, res) => {
          if(err) {
            client.unbind();
            resolve({error: err});
          }

          const opts = {
            scope: 'sub',
            filter: `(&(objectClass=*)(CN=${cn}))`,
            attributes: [
              'cn',
              'department',
              'description',
              'displayName',
              'mail',
              'o',
              'title',
              'userPrincipalName',
            ],
          };

          client.search('dc=corp,dc=udesc,dc=br', opts, (err, res) => {
            if(err) {
              client.unbind();
              resolve({error: err});
            }

            res.on('searchEntry', entry => {
              try {
                const object: any = entry.object;
                client.bind(object.dn, password, (err, res) => {
                  if(err) {
                    client.unbind();
                    resolve({error: err});
                  }

                  client.unbind();
                  resolve({success: object});
                });
              } catch (e) {
                resolve({error: e});
              }
            });

            res.on('error', err => {
              client.unbind();
              resolve({error: err});
            });
          });

        });
      } catch (e) {
        !!client && client.destroy();
        resolve({error: e});
      }
    });
  }

  public async teacherEnter(param: defaultParam<{ socket: any }>) {
    const
      model = 'user',
      required = this.attributeValidator([
        'auth', 'data',
        [
          'socket',
        ],
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const userId: string = await this.getUserIdByAuth(param.auth),
        ret = await this.sendToServer('game.teacherEnter', {
          userId,
          socket: param.data.socket,
        });
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

  public async playerEnter(param: playerEnter) {
    const
      model = 'player',
      required = this.attributeValidator([
        'socket',
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        ret = await this.sendToServer('game.playerEnter', param);
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

  public async playerReconnect(param: playerReconnect) {
    const
      required = this.attributeValidator([
        'socket', 'playerPin', 'gamePin',
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    await this.sendToServer('game.player.reconnect', param);
  }

  public async readAvailableGame(): Promise<returnData> {
    const model = 'user';
    try {
      const ret = await this.sendToServer('db.game.read', new FindObject({
          query: {
            $or: [
              {gameStatus: 'created'},
              {gameStatus: 'paused'},
            ]
          },
          select: 'gameSetting teams id teacher createdAt',
          populate: [
            {
              path: 'teacher',
              select: 'name surname email educationalInstitution id',
            }
          ]
        }));
      this.checkHubReturn(ret.data);
      if (ret.data.success.length) {
        const teams = [];
        ret.data.success[0].teams.forEach(team => {
          team.players = team.players.filter(player => !player.nick);
          if (team.players.length) teams.push(team);
        });
        ret.data.success[0].teams = teams;
      }
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

  public async readAvailableGameBase(): Promise<returnData> {
    const model = 'user';
    try {
      const ret = await this.sendToServer('db.gameBase.read', new FindObject({
          query: {
            $or: [
              {gameStatus: 'created'},
              {gameStatus: 'paused'},
            ]
          },
          select: 'gameSetting teams id teacher createdAt',
          populate: [
            {
              path: 'teacher',
              select: 'name surname email educationalInstitution id',
            }
          ]
        }));
      this.checkHubReturn(ret.data);
      const teams = [];
      if (ret.data.success.length) {
        ret.data.success[0].teams.forEach(team => {
          if (team.players.length < ret.data.success[0].gameSetting.playersPerTeam) teams.push(team);
        });
        ret.data.success[0].teams = teams;
      }
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

  public async readAvailableGameLogis(): Promise<returnData> {
    const model = "user";
    try {
      const ret = await this.sendToServer(
        "db.gameLogis.read",
        new FindObject({
          query: {
            $or: [{ gameStatus: "created" }, { gameStatus: "paused" }],
          },
          select: "gameSetting teams id teacher createdAt",
          populate: [
            {
              path: "teacher",
              select: "name surname email educationalInstitution id",
            },
          ],
        })
      );
      this.checkHubReturn(ret.data);
      if (ret.data.success.length) {
        const teams = [];
        ret.data.success[0].teams.forEach((team) => {
          team.players = team.players.filter((player) => !player.nick);
          if (team.players.length) teams.push(team);
        });
        ret.data.success[0].teams = teams;
      }
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: { error: e.message || e },
      });
    }
  }

  public async readAvailableGameTeam(gameId: string): Promise<returnData> {
    const model = 'user';
    try {
      const game = await this.sendToServer('db.game.read', new FindObject({
          query: gameId,
          select: 'gameSetting teams id teacher createdAt',
          populate: [
            {
              path: 'teacher',
              select: 'name surname email educationalInstitution id',
            }
          ]
        }));
      if (!game.data.success || game.data.error) return await this.returnHandler({
        model,
        data: {error: 'invalidGame'},
      });
      const teams = game.data.success.teams.filter(team => {
          let isAvailable = false;
          for (let i = 0; i < team.players.length; i++) {
            if (!team.players[i].nick) {
              isAvailable = true;
              break;
            }
          }
          return isAvailable;
        });
      return await this.returnHandler({
        model,
        data: {success: teams},
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      })
    }
  }

  public async readAvailableGameTeamPosition(gameId: string, teamId: string): Promise<returnData> {
    const model = 'user';
    try {
      const game = await this.sendToServer('db.game.read', new FindObject({
          query: gameId,
          select: 'gameSetting teams id teacher createdAt',
          populate: [
            {
              path: 'teacher',
              select: 'name surname email educationalInstitution id',
            }
          ]
        }));
      if (!game.data.success || game.data.error) return await this.returnHandler({
        model,
        data: {error: 'invalidGame'},
      });
      const teams = game.data.success.teams.filter(team => team._id.toString() === teamId);
      if (!teams.length) return await this.returnHandler({
        model,
        data: {error: 'invalidTeam'}
      });
      const position = teams[0].players.filter(player => !player.nick);
      return await this.returnHandler({
        model,
        data: {success: position},
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      })
    }
  }

  public async readAvailableGameTeamLogis(gameId: string): Promise<returnData> {
    const model = "user";
    try {
      const game = await this.sendToServer(
        "db.gameLogis.read",
        new FindObject({
          query: gameId,
          select: "gameSetting teams id teacher createdAt",
          populate: [
            {
              path: "teacher",
              select: "name surname email educationalInstitution id",
            },
          ],
        })
      );
      if (!game.data.success || game.data.error)
        return await this.returnHandler({
          model,
          data: { error: "invalidGame" },
        });
      const teams = game.data.success.teams.filter((team) => {
        let isAvailable = false;
        for (let i = 0; i < team.players.length; i++) {
          if (!team.players[i].nick) {
            isAvailable = true;
            break;
          }
        }
        return isAvailable;
      });
      return await this.returnHandler({
        model,
        data: { success: teams },
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: { error: e.message || e },
      });
    }
  }

  public async readAvailableGameTeamPositionLogis(
    gameId: string,
    teamId: string
  ): Promise<returnData> {
    const model = "user";
    try {
      const game = await this.sendToServer(
        "db.gameLogis.read",
        new FindObject({
          query: gameId,
          select: "gameSetting teams id teacher createdAt",
          populate: [
            {
              path: "teacher",
              select: "name surname email educationalInstitution id",
            },
          ],
        })
      );
      if (!game.data.success || game.data.error)
        return await this.returnHandler({
          model,
          data: { error: "invalidGame" },
        });
      const teams = game.data.success.teams.filter(
        (team) => team._id.toString() === teamId
      );
      if (!teams.length)
        return await this.returnHandler({
          model,
          data: { error: "invalidTeam" },
        });
      const position = teams[0].players.filter((player) => !player.nick);
      return await this.returnHandler({
        model,
        data: { success: position },
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: { error: e.message || e },
      });
    }
  }

  public async enterGame(param: enterGame): Promise<returnData> {
    const model = 'user',
      required = this.attributeValidator([
        "gameId", "teamId", "nick", "positionId"
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const game = await this.sendToServer('db.game.read', new FindObject({
          findOne: true,
          query: {
            _id: param.gameId,
            $or: [
              {gameStatus: 'created'},
              {gameStatus: 'paused'},
            ]
          },
          select: 'gameSetting teams id teacher gameStatus',
        }));
      this.checkHubReturn(game.data);
      const teams = game.data.success.teams,
        playedStart = Application.initialPlayed;
      let isValidPosition = false,
        teamData = {
          teamNick: '',
          positionType: '',
        };
      for (let i = 0; i < teams.length; i++) {
        if (teams[i]._id.toString() === param.teamId) {
          for (let p = 0; p < teams[i].players.length; p++) {
            if (teams[i].players[p]._id.toString() === param.positionId) {
              const position = teams[i].players[p];
              if (position.nick) return await this.returnHandler({
                model,
                data: {error: 'positionAlreadyOccupied'}
              });
              position.nick = param.nick;
              position.playedArray = playedStart;
              teamData.positionType = position.playerType;
              teamData.teamNick = teams[i].nick;
              isValidPosition = true;
            }
          }
        }
      }
      if (!isValidPosition) return await this.returnHandler({
        model,
        data: {error: 'invalidPosition'}
      });
      const
        updatedGame = await this.sendToServer('db.game.update', new UpdateObject({
          query: param.gameId,
          update: {
            teams,
          }
        }));
      this.checkHubReturn(updatedGame.data);
      return await this.returnHandler({
        model,
        data: {
          success: {
            playerId: param.positionId,
            ...param,
            teacher: game.data.success.teacher,
            playedArray: playedStart,
            gameStatus: game.data.success.gameStatus,
            gameSetting: {
              timer: game.data.success.gameSetting.timer,
              time: game.data.success.gameSetting.time,
              ...teamData,
            },
          },
        },
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      })
    }
  }

  public async enterGameBase(param: enterGame): Promise<returnData> {
    const model = 'user',
      required = this.attributeValidator([
        "gameId", "teamId", "nick",
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const game = await this.sendToServer('db.game.read', new FindObject({
          findOne: true,
          query: {
            _id: param.gameId,
            $or: [
              {gameStatus: 'created'},
              {gameStatus: 'paused'},
            ]
          },
          select: 'gameSetting teams id teacher',
        }));
      this.checkHubReturn(game.data);
      const teams = game.data.success.teams,
        team = teams.find(team => team._id.toString() === param.teamId),
        _id = new Types.ObjectId();
      if (team.players.length >= game.data.success.gameSetting.playersPerTeam) return await this.returnHandler({
        model,
        data: {error: "teamFull"}
      });
      team.players.push({_id, nick: param.nick});
      const updatedGame = await this.sendToServer('db.game.update', new UpdateObject({
          query: param.gameId,
          update: {
            teams,
          }
        }));
      this.checkHubReturn(updatedGame.data);
      return await this.returnHandler({
        model,
        data: {
          success: {
            playerId: _id,
            ...param,
            teacher: game.data.success.teacher,
          },
        },
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      })
    }
  }

  public async enterGameLogis(param: enterGame): Promise<returnData> {
    const model = "user",
      required = this.attributeValidator(
        ["gameId", "teamId", "nick", "positionId"],
        param
      );
    if (!required.success)
      return await this.getErrorAttributeRequired(required.error);
    try {
      const game = await this.sendToServer(
        "db.gameLogis.read",
        new FindObject({
          findOne: true,
          query: {
            _id: param.gameId,
            $or: [{ gameStatus: "created" }, { gameStatus: "paused" }],
          },
          select: "gameSetting teams id teacher gameStatus",
        })
      );
      this.checkHubReturn(game.data);
      const teams = game.data.success.teams,
        playedStart = this.getPlayedStart(game.data.success.gameSetting);
      let isValidPosition = false,
        teamData = {
          teamNick: "",
          positionType: "",
        };
      for (let i = 0; i < teams.length; i++) {
        if (teams[i]._id.toString() === param.teamId) {
          for (let p = 0; p < teams[i].players.length; p++) {
            if (teams[i].players[p]._id.toString() === param.positionId) {
              const position = teams[i].players[p];
              if (position.nick)
                return await this.returnHandler({
                  model,
                  data: { error: "positionAlreadyOccupied" },
                });
              position.nick = param.nick;
              teamData.positionType = position.playerType;
              position.playedArray = playedStart;
              teamData.teamNick = teams[i].nick;
              isValidPosition = true;
            }
          }
        }
      }
      if (!isValidPosition)
        return await this.returnHandler({
          model,
          data: { error: "invalidPosition" },
        });
      const updatedGame = await this.sendToServer(
        "db.gameLogis.update",
        new UpdateObject({
          query: param.gameId,
          update: {
            teams,
          },
        })
      );
      this.checkHubReturn(updatedGame.data);
      return await this.returnHandler({
        model,
        data: {
          success: {
            playerId: param.positionId,
            ...param,
            teacher: game.data.success.teacher,
            playedArray: playedStart,
            gameStatus: game.data.success.gameStatus,
            gameSetting: {
              timer: game.data.success.gameSetting.timer,
              time: game.data.success.gameSetting.time,
              productInfos: game.data.success.gameSetting.productInfos,
              varegistaOwnStockAvailable:
                game.data.success.gameSetting.varegistaOwnStockAvailable,
              atacadistaOwnStockAvailable:
                game.data.success.gameSetting.atacadistaOwnStockAvailable,
              fabricanteOwnStockAvailable:
                game.data.success.gameSetting.fabricanteOwnStockAvailable,
              rentStockCostByPallet:
                game.data.success.gameSetting.rentStockCostByPallet,
              ...teamData,
            },
          },
        },
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: { error: e.message || e },
      });
    }
  }

}

export default new OpenHandler();

interface returnData {
  success: boolean,
  data: any
}

interface loginData {
  login: string,
  password: string
}

interface defaultParam<T> {
  auth: string,
  data: T
}

interface playerEnter {
  playerId: string,
  gameId: string,
  teamId: string,
  nick: string,
  teacher: string,
  socket: any,
}

interface playerReconnect {
  playerPin: string,
  gamePin: string,
  socket: any,
}

interface enterGame {
  gameId: string,
  teamId: string,
  nick: string,
  positionId: string,
}