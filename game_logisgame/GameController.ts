import {Source} from '../events/Source'
import {FindObject} from "../handlers/util/FindObject";
import {Game} from './Game'
import {UpdateObject} from "../handlers/util/UpdateObject";

export class GameLogisController extends Source {
  private readonly gameMap;
  private readonly _name: string;

  constructor() {
    super();
    this.gameMap = new Map();
    this._name = "gameLogis";
    this.wiring();
    this.readStartedGames();
  }

  private get name() {
    return this._name;
  }

  private async create(msg) {
    if (msg.source_id === this.id) return;
    try {
      if (!msg.data.success) return this.answer(msg.id, msg.event, null, 'createGameError');
      const game = msg.data.success;
      if (!game.userId || !game.groups || game.groups.length < 2) return this.answer(msg.id, msg.event, null, 'createGameError');
      const
        promises = await Promise.all([
          this.sendToServer('db.user.read', new FindObject({
            query: game.userId,
            select: 'userSettings id',
            populate: [
              {
                path: 'userSettings',
              }
            ]
          })),
          this.sendToServer('db.settingLogis.read', new FindObject({
            findOne: true,
            query: {
              isDefault: true,
            },
          })),
        ]);
      for (let i = 0; i < promises.length; i++) {
        if (!promises[i].data.success || promises[i].data.error) return this.answer(msg.id, msg.event, null, 'createGameError');
      }
      const
        gameConfig = promises[0].data.success.userSettings ? promises[0].data.success.userSettings : promises[1].data.success,
        gameToSave = {
          gameSetting: {
            async: gameConfig.async,
            timer: gameConfig.timer,
            time: gameConfig.time,
            playersPerTeam: gameConfig.playersPerTeam,
            weekAmount: gameConfig.weekAmount,
            demands: gameConfig.demands,
            productInfos: {
              name: gameConfig.productInfos.name,
              varegistaPrice: gameConfig.productInfos.varegistaPrice,
              atacadistaPrice: gameConfig.productInfos.atacadistaPrice,
              fabricantePrice: gameConfig.productInfos.fabricantePrice,
              productsPerBox: gameConfig.productInfos.productsPerBox,
              boxesPerPallet: gameConfig.productInfos.boxesPerPallet,
            },
            defaultDeliverCost: gameConfig.defaultDeliverCost,
            ownStockAvailable: gameConfig.ownStockAvailable,
            varegistaOwnStockAvailable: gameConfig.varegistaOwnStockAvailable,
            atacadistaOwnStockAvailable: gameConfig.atacadistaOwnStockAvailable,
            fabricanteOwnStockAvailable: gameConfig.fabricanteOwnStockAvailable,
            rentStockCostByPallet: gameConfig.rentStockCostByPallet,
            varegistaPenaltyForUndeliveredProduct: gameConfig.varegistaPenaltyForUndeliveredProduct,
            atacadistaPenaltyForUndeliveredProduct: gameConfig.atacadistaPenaltyForUndeliveredProduct,
            fabricantePenaltyForUndeliveredProduct: gameConfig.fabricantePenaltyForUndeliveredProduct,
            atacadistaMultiplicador: gameConfig.atacadistaMultiplicador,
            fabricanteMultiplicador: gameConfig.fabricanteMultiplicador,
          },
          teacher: game.userId,
          teams: game.groups,
          pin: game.pin,
        };
      if (!game.isApi) {
        gameToSave.teams = [];
        game.groups.forEach(group => {
          gameToSave.teams.push({
            nick: group.name || group.nick,
            players: [
              {
                playerType: 'fabricante',
              },
              {
                playerType: 'atacadista',
              },
              {
                playerType: 'varegista',
              }
            ]
          });
        });
      }
      const savedGame = await this.sendToServer('db.gameLogis.create', gameToSave);
      if (!savedGame.data.success || savedGame.data.error) return this.answer(msg.id, msg.event, null, 'createGameError');
      this.gameMap.set(game.userId, new Game(savedGame.data.success[0].gameSetting, savedGame.data.success[0].teams, savedGame.data.success[0].id, savedGame.data.success[0].pin, game.userId));
      this.answer(msg.id, msg.event, savedGame.data.success, null);
    } catch (e) {
      this.answer(msg.id, msg.event, null, e.message || e);
    }
  }

  private async teacherEnter(msg) {
    if (msg.source_id === this.id) return;
    try {
      if (!msg.data.success) return this.answer(msg.id, msg.event, null, 'teacherEnterError');
      const
        game = this.gameMap.get(msg.data.success.userId);
      game.setTeacher(msg.data.success.socket);
      this.answer(msg.id, msg.event, true, null);
    } catch (e) {
      this.answer(msg.id, msg.event, null, e.message || e);
    }
  }

  private async playerEnter(msg) {
    if (msg.source_id === this.id) return;
    try {
      if (!msg.data.success) return this.answer(msg.id, msg.event, null, 'playerEnterError');
      if (!await this.checkExistPlayer({
        playerId: msg.data.success.playerId,
        gameId: msg.data.success.gameId,
        teamId: msg.data.success.teamId,
        nick: msg.data.success.nick,
        teacher: msg.data.success.teacher,
      })) return this.answer(msg.id, msg.event, null, 'invalidGame');
      const
        game = this.gameMap.get(msg.data.success.teacher);
      await game.setNewPlayer(msg.data.success);
      this.answer(msg.id, msg.event, true, null);
    } catch (e) {
      this.answer(msg.id, msg.event, null, e.message || e);
    }
  }

  private playerReconnect(msg) {
    if (msg.source_id === this.id) return;
    const
      event = 'player.reconnect.error';
    try {
      if (!msg.data.success) return msg.data.socket.emit(event, {error: 'cantReconnect'});
      const
        game = this.getGameByPin(msg.data.success.gamePin);
      game.playerReconnect({
        socket: msg.data.success.socket,
        playerPin: msg.data.success.playerPin
      });
    } catch (e) {
      msg.data.socket.emit(event, {error: e});
    }
  }

  private getGameByPin(pin) {
    for (const game of this.gameMap.values()) {
      if (game.pin === pin) return game;
    }
  }

  private async checkExistPlayer(playerData: playerData) {
    try {
      const gameDB = await this.sendToServer('db.gameLogis.read', new FindObject({
          query: playerData.gameId,
          select: 'id gameStatus teacher teams'
        }));
      if (!gameDB.data.success || gameDB.data.error) return false;
      if (
        (gameDB.data.success.gameStatus !== 'created' &&
          gameDB.data.success.gameStatus !== 'paused') ||
        playerData.teacher !== gameDB.data.success.teacher.toString() ||
        playerData.gameId !== gameDB.data.success.id
      ) return false;
      for (let i = 0; i < gameDB.data.success.teams.length; i++) {
        if (playerData.teamId === gameDB.data.success.teams[i]._id.toString()) {
          for (let j = 0; j < gameDB.data.success.teams[i].players.length; j++) {
            if (gameDB.data.success.teams[i].players[j]._id.toString() === playerData.playerId) return true;
          }
        }
      }
      return false;
    } catch (e) {
      throw e;
    }
  }

  private async readStartedGames() {
    const ret = await this.sendToServer('db.gameLogis.read', new FindObject({
        query: {
          $or: [
            {
              gameStatus: 'created',
            },
            {
              gameStatus: 'started',
            },
            {
              gameStatus: 'paused',
            },
          ],
        },
      }));
    if (!ret.data.success || !ret.data.success.length) return;
    const gamesId = ret.data.success.map(game => game.id);
    await this.sendToServer('db.gameLogis.update', new UpdateObject({
      query: {
        _id: {
          $in: gamesId,
        }
      },
      update: {
        gameStatus: 'paused',
      },
    }));
    ret.data.success.forEach(game => {
      this.createGameRoutine(game);
    });
  }

  private createGameRoutine(game) {
    this.gameMap.set(game.teacher.toString(), new Game(game.gameSetting, game.teams, game.id, game.pin, game.teacher.toString()));
  }

  answer(messageId, event, success, error) {
    let data = {
      success: success,
      error: error
    };
    this.hub.send(this, event, data, messageId);
  }

  wiring() {
    this.hub.on(`${this.name}.create`, this.create.bind(this));
    this.hub.on(`${this.name}.teacherEnter`, this.teacherEnter.bind(this));
    this.hub.on(`${this.name}.playerEnter`, this.playerEnter.bind(this));
    this.hub.on(`${this.name}.player.reconnect`, this.playerReconnect.bind(this));
  }
}

interface playerData {
  playerId: string,
  gameId: string,
  teamId: string,
  nick: string,
  teacher: string,
}