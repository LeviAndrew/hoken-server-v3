import {BasicManager} from "../../BasicManager"
import {Model} from "../model/GameLogis"

export class GameLogis extends BasicManager {
  wireCustomListeners() {
    this.hub.on("db." + this.eventName + ".updatePlayerPin", this.updatePlayerPin.bind(this));
    this.hub.on("db." + this.eventName + ".removeTeam", this.removeTeam.bind(this));
    this.hub.on("db." + this.eventName + ".removePlayer", this.removePlayer.bind(this));
  }

  private async updatePlayerPin(msg) {
    if (msg.source_id === this.id) return;
    try {
      const
        gameModel: any = await this.model
          .findById(msg.data.success.id)
          .exec(),
        team = gameModel.teams.filter(team => team._id.toString() === msg.data.success.team);
      if (!team.length) return this.answer(msg.id, msg.event, null, 'invalidTeam');
      let
        playedArray;
      team[0].players.forEach(player => {
        if (player._id.toString() === msg.data.success.player) {
          player['pin'] = msg.data.success.pin;
          playedArray = JSON.parse(JSON.stringify(player.playedArray));
        }
      });
      await gameModel.save();
      return this.answer(msg.id, "updatePlayerPin", {playedArray}, null);
    } catch (e) {
      return this.answer(msg.id, "updatePlayerPin", null, 'unexpectError');
    }
  }

  private async removeTeam(msg) {
    if (msg.source_id === this.id) return;
    try {
      if (!msg.data.success || !msg.data.success.gameId || !msg.data.success.teamId) return this.answer(msg.id, "removeTeam", null, 'gameIdAndTeamIdRequireds');
      const
        gameModel: any = await this.model
          .findById(msg.data.success.gameId)
          .exec(),
        teams = gameModel.teams.filter(team => team._id.toString() !== msg.data.success.teamId);
      if (!teams.length) return this.answer(msg.id, msg.event, null, 'invalidTeam');
      gameModel.teams = teams;
      await gameModel.save();
      return this.answer(msg.id, "removeTeam", {teamId: msg.data.success.teamId}, null);
    } catch (e) {
      return this.answer(msg.id, "removeTeam", null, 'unexpectError');
    }
  }

  private async removePlayer(msg) {
    if (msg.source_id === this.id) return;
    try {
      if (!msg.data.success || !msg.data.success.gameId || !msg.data.success.teamId || !msg.data.success.playerId) return this.answer(msg.id, "removePlayer", null, 'gameIdAndTeamIdRequireds');
      const
        gameModel: any = await this.model
          .findById(msg.data.success.gameId)
          .exec(),
        team = gameModel.teams.filter(team => team._id.toString() === msg.data.success.teamId);
      if (!team.length) return this.answer(msg.id, msg.event, null, 'invalidTeam');
      team[0].players.forEach(player => {
        if (player._id.toString() === msg.data.success.playerId) {
          player.nick = null;
          player.pin = null;
          player.playedArray = null;
        }
      })
      await gameModel.save();
      return this.answer(msg.id, "removePlayer", {
        teamId: msg.data.success.teamId,
        playerId: msg.data.success.playerId
      }, null);
    } catch (e) {
      return this.answer(msg.id, "removePlayer", null, 'unexpectError');
    }
  }

  get model() {
    return Model;
  }

  get eventName() {
    return 'gameLogis';
  }
}