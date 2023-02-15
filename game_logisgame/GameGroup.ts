import { Source } from "../events/Source";
import { FindObject } from "../handlers/util/FindObject";
import { createDeflateRaw } from "zlib";

export class GameGroup extends Source {
  private readonly nick: string;
  private readonly teamId: string;
  private readonly gameId: string;
  private readonly teamPin: number;
  private _teacherSocket: any;
  private playersPerTeam;
  private players;
  private onStudentDisconnect: any;
  private onTeamFinishedPlayed: any;
  private finisehd: boolean = false;
  private currentWeek = 0;
  private finishedGameGroup: boolean = false;
  private sendLastPlayed: boolean = false;
  private interval: any;

  constructor(
    nick: string,
    playersPerTeam: number,
    teamId: string,
    gameId: string,
    teamPin: number,
    onStudentDisconnect: any,
    players: any[],
    onTeamFinishedPlayed: any
  ) {
    super();
    this.nick = nick;
    this.teamId = teamId;
    this.gameId = gameId;
    this.playersPerTeam = playersPerTeam;
    this.players = [];
    this.teamPin = teamPin;
    if (players.length) this.setPlayers(players);
    this.onStudentDisconnect = onStudentDisconnect;
    this.onTeamFinishedPlayed = onTeamFinishedPlayed;
  }

  private setPlayers(players: any[]) {
    players.forEach((player) => {
      this.players.push({
        socket: null,
        playerId: player.id || player._id.toString(),
        gameId: this.gameId,
        teamId: this.teamId,
        nick: player.nick,
        pin: player.pin,
        playerType: player.playerType,
      });
    });
  }

  public set teacherSocket(teacherSocket) {
    this._teacherSocket = teacherSocket;
  }

  public async addPlayer(player) {
    this.addPlayerListeners(player);
    const gamePlayer = this.players.filter(
      (pl) => pl.playerId === player.playerId
    )[0];
    const pin = `${this.players.filter((pl) => pl.pin).length + 1}${
      this.teamPin
    }`;
    gamePlayer.pin = pin;
    gamePlayer.socket = player.socket;
    gamePlayer.nick = player.nick;
    const playedArray = await this.sendToServer("db.gameLogis.updatePlayerPin", {
      id: player.gameId,
      team: player.teamId,
      player: player.playerId,
      pin,
    });
    this._teacherSocket.emit("student.enterLogis", {
      success: {
        playerId: player.playerId,
        teamId: player.teamId,
        nick: player.nick,
        pin,
        playerType: gamePlayer.playerType,
      },
    });
  }

  private addPlayerListeners(player) {
    player.socket.removeAllListeners();
    player.socket.on("player.takeDecision", this.takeDecision.bind(this));
    const me = this;
    player.socket.on("disconnectLogis", function () {
      me.getStudentDisconnected(this.id);
    });
  }

  public async reconnectPlayer(param: { socket: any; playerPin: string }) {
    const game = await this.sendToServer(
      "db.gameLogis.read",
      new FindObject({
        query: this.gameId,
        select: "teams teacher gameStatus gameSetting",
      })
    );
    if (!game.data.success || game.data.error || !game.data.success.teams)
      param.socket.emit("player.reconnectLogis.error", { error: "invalidGame" });
    let player;
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].pin === param.playerPin && !this.players[i].socket) {
        player = this.players[i];
        break;
      }
    }
    if (!player) return;
    player.socket = param.socket;
    this.addPlayerListeners(player);
    const teamDB = game.data.success.teams.filter(
      (team) => team._id.toString() === this.teamId
    );
    if (!teamDB.length) return this.playerReconnectError(player, "invalidTeam");
    const playerDB = teamDB[0].players.filter(
      (pDB) => pDB._id.toString() === player.playerId
    );
    if (!playerDB.length)
      return this.playerReconnectError(player, "invalidPlayer");
    if (player.decisionDone) {
      playerDB[0].playedArray[playerDB[0].playedArray.length - 1].decisao =
        player.lastDecision;
    }
    player.socket.emit("player.reconnectLogis", {
      playerId: player.playerId,
      gameId: player.gameId,
      teamId: player.teamId,
      nick: player.nick,
      playedArray: playerDB[0].playedArray,
      positionId: player.playerId,
      teacher: game.data.success.teacher,
      gameStatus: game.data.success.gameStatus,
      gameSetting: {
        timer: game.data.success.gameSetting.timer,
        time: game.data.success.gameSetting.time,
        teamNick: teamDB[0].nick,
        positionType: player.playerType,
        productInfos: game.data.success.gameSetting.productInfos,
        varegistaOwnStockAvailable:
          game.data.success.gameSetting.varegistaOwnStockAvailable,
        atacadistaOwnStockAvailable:
          game.data.success.gameSetting.atacadistaOwnStockAvailable,
        fabricanteOwnStockAvailable:
          game.data.success.gameSetting.fabricanteOwnStockAvailable,
        rentStockCostByPallet:
          game.data.success.gameSetting.rentStockCostByPallet,
      },
    });
    return this._teacherSocket.emit("student.reconnectLogis", {
      playerId: player.playerId,
      teamId: player.teamId,
      nick: player.nick,
      pin: player.pin,
      playerType: player.playerType,
    });
  }

  private playerReconnectError(player, error: string) {
    player.socket.emit("player.reconnectLogis.error", { error: error });
    player.socket.removeAllListeners();
    player.socket = null;
  }

  private getStudentDisconnected(socketId) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].socket && this.players[i].socket.id === socketId) {
        this.onStudentDisconnect(
          this.players[i].teamId,
          this.players[i].playerId
        );
        this.players[i].socket.removeAllListeners();
        this.players[i].socket = null;
      }
    }
  }

  public async takeDecision(data) {
    const player = this.players.find(
        (player) => player.playerId === data.request.playerId
      ),
      event = "decision.received";
    if (player.decisionDone)
      return player.socket.emit(event, { error: "decisionAlreadyTaken" });
    const game = await this.sendToServer(
      "db.gameLogis.read",
      new FindObject({
        query: this.gameId,
        select: "gameStatus",
      })
    );
    if (!game.data.success || game.data.error)
      return player.socket.emit(event, { error: "invalidGame" });
    if (
      !game.data.success.gameStatus ||
      game.data.success.gameStatus !== "started"
    )
      return player.socket.emit(event, { error: "gameNotStarted" });
    player.lastDecision = data.request.decision;
    player.deliveryType = data.request.deliveryType;
    player.decisionDone = true;
    player.socket.emit(event, { success: player.lastDecision });
    this.players.forEach((pl) => {
      if (pl.playerId !== player.playerId)
        pl.socket.emit("participant.decision", {
          playerType: player.playerType,
        });
    });
    this._teacherSocket.emit("student.decision", { playerId: player.playerId });
    return this.checkEndLevel();
  }

  checkEndLevel() {
    for (let i = 0; i < this.players.length; i++) {
      if (!this.players[i].decisionDone) return;
    }
    clearInterval(this.interval);
    this.finisehd = true;
    return this.onTeamFinishedPlayed(this);
  }

  public endTime() {
    this.players.forEach((player) => {
      if (!player.decisionDone) {
        player.decisionDone = true;
        player.lastDecision = 0;
      }
    });
    this.finisehd = true;
  }

  public emitNextWeek(teamDB) {
    const playerMap = new Map(teamDB.players.map((pl) => [pl.playerType, pl]));
    if (this.finishedGameGroup) {
      if (this.sendLastPlayed) return;
      return this.players.forEach((player) => {
        const playerDB: any = playerMap.get(player.playerType);
        player.socket.emit(
          "player.endGame",
          playerDB.playedArray[playerDB.playedArray.length - 1]
        );
      });
    }
    this.players.forEach((player) => {
      const playerDB: any = playerMap.get(player.playerType);
      player.socket.emit("player.nextWeek", [
        playerDB.playedArray[playerDB.playedArray.length - 2],
        playerDB.playedArray[playerDB.playedArray.length - 1],
      ]);
    });
    this.finisehd = false;
    clearInterval(this.interval);
    this.sendTeacherNextWeek();
  }

  private async sendTeacherNextWeek() {
    const event = "group.nextWeek",
      game = (
        await this.sendToServer(
          "db.gameLogis.read",
          new FindObject({
            query: this.gameId,
            select: "teams",
          })
        )
      ).data.success;
    if (!game || !game.teams)
      return this._teacherSocket.emit(event, { error: "cantReadGameTeam" });
    const team = game.teams.filter((t) => t._id.toString() === this.teamId);
    this._teacherSocket.emit(event, { success: team });
  }

  public toNextWeek(teamDB, gameSetting) {
    if (this.finishedGameGroup) return;
    const playerMap = new Map(teamDB.players.map((pl) => [pl.playerType, pl]));
    this.players.forEach((pl) => {
      const player: any = playerMap.get(pl.playerType);
      player.playedArray[player.playedArray.length - 1].decisao =
        pl.lastDecision;
      player.playedArray[player.playedArray.length - 1].deliveryType =
        pl.deliveryType;
      pl.lastDecision = null;
      pl.decisionDone = false;
      pl.deliveryType = "e2";
    });
    if (this.currentWeek === gameSetting.weekAmount) {
      this.players.forEach((pl) => pl.socket.removeAllListeners());
      return (this.finishedGameGroup = true);
    }
    const varegista: any = playerMap.get("varegista"),
      atacadista: any = playerMap.get("atacadista"),
      fabricante: any = playerMap.get("fabricante"),
      isVaregistaFastDelivery =
        varegista.playedArray[varegista.playedArray.length - 2].deliveryType ===
        "e2",
      isAtacadistaFastDelivery =
        atacadista.playedArray[atacadista.playedArray.length - 2]
          .deliveryType === "e2",
      isFabricanteFastDelivery =
        fabricante.playedArray[fabricante.playedArray.length - 2]
          .deliveryType === "e2";
    this.calculateNextPlayed(
      varegista,
      gameSetting.demands[varegista.playedArray.length],
      isVaregistaFastDelivery
        ? 0
        : atacadista.playedArray[atacadista.playedArray.length - 1]
            .entregaMercadoria,
      gameSetting
    );
    this.calculateNextPlayed(
      atacadista,
      varegista.playedArray[varegista.playedArray.length - 2].decisao,
      isAtacadistaFastDelivery
        ? 0
        : fabricante.playedArray[fabricante.playedArray.length - 1]
            .entregaMercadoria,
      gameSetting
    );
    this.calculateNextPlayed(
      fabricante,
      atacadista.playedArray[atacadista.playedArray.length - 2].decisao,
      isFabricanteFastDelivery
        ? 0
        : fabricante.playedArray[fabricante.playedArray.length - 2].decisao *
            gameSetting.productInfos.boxesPerPallet,
      gameSetting
    );
    if (
      varegista.playedArray[varegista.playedArray.length - 2].deliveryType ===
      "e2"
    ) {
      varegista.playedArray[varegista.playedArray.length - 1] =
        this.calculateExpressDelivery(
          atacadista.playedArray[atacadista.playedArray.length - 1]
            .entregaMercadoria,
          varegista.playedArray[varegista.playedArray.length - 1],
          gameSetting,
          "varegista"
        );
    }
    if (
      atacadista.playedArray[atacadista.playedArray.length - 2].deliveryType ===
      "e2"
    ) {
      atacadista.playedArray[atacadista.playedArray.length - 1] =
        this.calculateExpressDelivery(
          fabricante.playedArray[atacadista.playedArray.length - 1]
            .entregaMercadoria,
          atacadista.playedArray[atacadista.playedArray.length - 1],
          gameSetting,
          "atacadista"
        );
    }
    if (
      fabricante.playedArray[fabricante.playedArray.length - 2].deliveryType ===
      "e2"
    ) {
      fabricante.playedArray[fabricante.playedArray.length - 1] =
        this.calculateExpressDelivery(
          fabricante.playedArray[fabricante.playedArray.length - 1].decisao *
            gameSetting.productInfos.boxesPerPallet,
          fabricante.playedArray[fabricante.playedArray.length - 1],
          gameSetting,
          "fabricante"
        );
    }
    this.currentWeek = varegista.playedArray.length;
  }

  private calculateExpressDelivery(
    fastDelivery,
    currentPlayed,
    gameSetting,
    playerType
  ) {
    const recebimentoMercadori =
        currentPlayed.recebimentoMercadori + fastDelivery,
      estoqueDisponivel = currentPlayed.estoqueInicial + recebimentoMercadori,
      entregaMercadoria =
        estoqueDisponivel > currentPlayed.recebimentoPedido
          ? currentPlayed.recebimentoPedido
          : estoqueDisponivel,
      pendencia =
        entregaMercadoria >= currentPlayed.recebimentoMercadori
          ? 0
          : currentPlayed.recebimentoMercadori - entregaMercadoria,
      additionalFastCost = Math.ceil(gameSetting.defaultDeliverCost * 0.3);
    let estoqueFinal =
        entregaMercadoria >= estoqueDisponivel
          ? 0
          : estoqueDisponivel - entregaMercadoria,
      rentStockUsage = 0,
      stock = 0;
    if (playerType === "varegista")
      stock = gameSetting.varegistaOwnStockAvailable;
    if (playerType === "atacadista")
      stock = gameSetting.atacadistaOwnStockAvailable;
    if (playerType === "fabricante")
      stock = gameSetting.fabricanteOwnStockAvailable;
    const ownStockAvailableUnit =
      stock * gameSetting.productInfos.boxesPerPallet;
    if (estoqueFinal > ownStockAvailableUnit) {
      rentStockUsage = estoqueFinal - ownStockAvailableUnit;
      estoqueFinal = ownStockAvailableUnit;
    }
    return {
      estoqueInicial: currentPlayed.estoqueInicial,
      recebimentoMercadori,
      estoqueDisponivel,
      recebimentoPedido: currentPlayed.recebimentoPedido,
      entregaMercadoria,
      pendencia,
      estoqueFinal,
      rentStockUsage,
      custo: currentPlayed.custo + additionalFastCost,
      custoTotal: currentPlayed.custoTotal + additionalFastCost,
      deliveryType: null,
      decisao: null,
    };
  }

  calculateNextPlayed(
    player,
    recebimentoPedido,
    recebimentoMercadori,
    gameSetting
  ) {
    if (player.playerType !== "varegista")
      recebimentoPedido =
        recebimentoPedido * gameSetting.productInfos.boxesPerPallet;
    const lastPlayed = player.playedArray[player.playedArray.length - 1],
      estoqueInicial = lastPlayed.estoqueFinal,
      estoqueDisponivel =
        estoqueInicial + lastPlayed.rentStockUsage + recebimentoMercadori,
      entregaMercadoria =
        estoqueDisponivel > recebimentoPedido
          ? recebimentoPedido
          : estoqueDisponivel,
      pendencia =
        entregaMercadoria >= recebimentoPedido
          ? 0
          : recebimentoPedido - entregaMercadoria;
    let estoqueFinal =
        entregaMercadoria >= estoqueDisponivel
          ? 0
          : estoqueDisponivel - entregaMercadoria,
      rentStockUsage = 0,
      custo = gameSetting.defaultDeliverCost,
      stock = 0;
    if (player.playerType === "varegista")
      stock = gameSetting.varegistaOwnStockAvailable;
    if (player.playerType === "atacadista")
      stock = gameSetting.atacadistaOwnStockAvailable;
    if (player.playerType === "fabricante")
      stock = gameSetting.fabricanteOwnStockAvailable;
    const ownStockAvailableUnit =
      stock * gameSetting.productInfos.boxesPerPallet;
    if (estoqueFinal > ownStockAvailableUnit) {
      rentStockUsage = estoqueFinal - ownStockAvailableUnit;
      estoqueFinal = ownStockAvailableUnit;
      custo += Math.ceil(
        rentStockUsage / gameSetting.productInfos.boxesPerPallet
      );
    }
    if (player.playerType === "varegista")
      custo += pendencia * gameSetting.varegistaPenaltyForUndeliveredProduct;
    if (player.playerType === "atacadista")
      custo += pendencia * gameSetting.atacadistaPenaltyForUndeliveredProduct;
    if (player.playerType === "fabricante")
      custo += pendencia * gameSetting.fabricantePenaltyForUndeliveredProduct;
    player.playedArray.push({
      estoqueInicial,
      recebimentoMercadori,
      estoqueDisponivel,
      recebimentoPedido,
      entregaMercadoria,
      pendencia,
      rentStockUsage,
      estoqueFinal,
      custo,
      custoTotal: lastPlayed.custoTotal + custo,
      deliveryType: null,
      decisao: null,
    });
  }

  public sendDataEvent(event, msg) {
    this.players.forEach((player) => {
      if (!player.socket) return;
      player.socket.emit(event, msg);
    });
  }

  public checkStudentsIn() {
    for (let i = 0; i < this.players.length; i++) {
      if (!this.players[i].socket) return false;
    }
    return true;
  }

  public groupTimer(count) {
    if (this.finishedGameGroup) return;
    const jump = 5;
    this.interval = setInterval(async () => {
      count -= jump;
      this.players.forEach((player) => {
        if (!player.socket) return;
        player.socket.emit("sync.timer", { currentTime: count });
      });
      if (count <= 0) {
        this.endTime();
        this.checkEndLevel();
      }
    }, jump * 1000);
  }

  public removeGroupData() {
    this.players.forEach((player) => {
      if (player.socket) {
        player.socket.removeAllListeners();
        player.socket.disconnect();
      }
    });
    this.players = null;
    this._teacherSocket = null;
    this.onTeamFinishedPlayed = null;
    this.onStudentDisconnect = null;
  }

  public removePlayer(playerId) {
    this.players.forEach((player) => {
      if (player.playerId === playerId) {
        if (player.socket) {
          player.socket.removeAllListeners();
          player.socket.disconnect();
        }
        player.socket = null;
        player.nick = null;
        player.pin = null;
      }
    });
  }
}
