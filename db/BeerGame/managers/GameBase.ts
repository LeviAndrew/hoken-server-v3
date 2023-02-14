import {BasicManager} from "../../BasicManager"
import {Model} from "../model/GameBase"

export class GameBase extends BasicManager {
  wireCustomListeners() {
    this.hub.on("db." + this.eventName + ".updatePlayerPin", this.updatePlayerPin.bind(this));
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
      team[0].players.forEach(player => {
        if (player._id.toString() === msg.data.success.player) player['pin'] = msg.data.success.pin;
      });
      await gameModel.save();
      return this.answer(msg.id, "updatePlayerPin", true, null);
    } catch (e) {
      return this.answer(msg.id, "updatePlayerPin", null, 'unexpectError');
    }
  }

  get model() {
    return Model;
  }

  get eventName() {
    return 'gameBase';
  }
}