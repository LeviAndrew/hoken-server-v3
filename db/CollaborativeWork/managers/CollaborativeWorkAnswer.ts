import {BasicManager} from "../../BasicManager";
import {Model} from "../model/CollaborativeWorkAnswer";

export class CollaborativeWorkAnswer extends BasicManager {
  wireCustomListeners() {
    this.hub.on("db." + this.eventName + ".updateAnswerFile", this.updateAnswer.bind(this));
    this.hub.on("db." + this.eventName + ".updateAnswerData", this.updateAnswerData.bind(this));
    this.hub.on("db." + this.eventName + ".deleteAnswer", this.deleteAnswer.bind(this));
    this.hub.on("db." + this.eventName + ".updateParticipants", this.updateParticipants.bind(this));
    this.hub.on("db." + this.eventName + ".deleteParticipant", this.deleteParticipant.bind(this));
  }

  private async updateAnswer(msg) {
    if (msg.source_id === this.id) return;
    try {
      const
        answerModel: any = await this.model
          .findById(msg.data.success.query.id)
          .exec();
      const
        team = answerModel.teams.filter(team => team._id.toString() === msg.data.success.query.teamId)[0],
        answer = team.answers.filter(answer => answer._id.toString() === msg.data.success.query.teamAnswerId)[0];
      answer.files.push({
        name: msg.data.success.update.name,
        path: msg.data.success.update.path,
        timestamp: new Date().getTime(),
        sendBy: msg.data.success.update.sendBy,
      });
      await answerModel.save();
      return this.answer(msg.id, "updateAnswerFile", true, null);
    } catch (e) {
      return this.answer(msg.id, "updateAnswerFile", null, 'unexpectError');
    }
  }

  private async updateAnswerData(msg) {
    if (msg.source_id === this.id) return;
    try {
      const
        answerModel: any = await this.model
          .findById(msg.data.success.query.id)
          .exec();
      const
        team = answerModel.teams.filter(team => team._id.toString() === msg.data.success.query.teamId)[0];
      team.answers.push({
        _id: msg.data.success.update._id,
        title: msg.data.success.update.title,
        comment: msg.data.success.update.comment,
        sendDate: msg.data.success.update.sendDate,
        sendBy: msg.data.success.update.sendBy,
        files: msg.data.success.update.files,
      });
      await answerModel.save();
      return this.answer(msg.id, "updateAnswerData", true, null);
    } catch (e) {
      return this.answer(msg.id, "updateAnswerData", null, 'unexpectError');
    }
  }

  private async updateParticipants(msg) {
    if (msg.source_id === this.id) return;
    try {
      const
        answerModel: any = await this.model
          .findById(msg.data.success.query.id)
          .exec();
      const
        team = answerModel.teams.filter(team => team._id.toString() === msg.data.success.query.teamId)[0];
      team.participants.push({
        accepted: msg.data.success.update.accepted,
        _id: msg.data.success.update._id,
        user: msg.data.success.update.newParticipant,
      });
      await answerModel.save();
      return this.answer(msg.id, "updateParticipants", true, null);
    } catch (e) {
      return this.answer(msg.id, "updateParticipants", null, 'unexpectError');
    }
  }

  private async deleteAnswer(msg) {
    if (msg.source_id === this.id) return;
    try {
      const
        answerModel: any = await this.model
          .findById(msg.data.success.answerId)
          .exec();
      const
        team = answerModel.teams.filter(team => team._id.toString() === msg.data.success.teamId)[0];
        team.answers = team.answers.filter(answer => answer._id.toString() !== msg.data.success.answer);
      await answerModel.save()
      return this.answer(msg.id, "deleteAnswer", true, null);
    } catch (e) {
      return this.answer(msg.id, "deleteAnswer", null, 'unexpectError');
    }
  }

  private async deleteParticipant(msg) {
    if (msg.source_id === this.id) return;
    try {
      const
        answerModel: any = await this.model
          .findById(msg.data.success.answerId)
          .exec();
      const
        team = answerModel.teams.filter(team => team._id.toString() === msg.data.success.teamId)[0];
        team.participants = team.participants.filter(user => user._id.toString() !== msg.data.success.participantId);
      await answerModel.save()
      return this.answer(msg.id, "deleteParticipant", true, null);
    } catch (e) {
      return this.answer(msg.id, "deleteParticipant", null, 'unexpectError');
    }
  }

  get model() {
    return Model;
  }

  get eventName() {
    return 'collaborativeWorkAnswer';
  }
}