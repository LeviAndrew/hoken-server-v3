import {BasicManager} from "../../BasicManager";
import {Model} from "../model/TestApplication";

export class TestApplication extends BasicManager {
  wireCustomListeners () {
    this.hub.on("db." + this.eventName + ".studentAnswer", this.studentAnswer.bind(this));
  }

  private async studentAnswer(msg){
    if (msg.source_id === this.id) return;
    try {
      let ret;
      let testApplication: any = await this.model.findById(msg.data.success.testApplicationId);
      for(let i = 0; i < testApplication.answers.length; i ++){
        if(testApplication.answers[i]._id.toString() === msg.data.success.questionId) {
          testApplication.answers[i].answers = msg.data.success.answers;
          ret = testApplication.answers[i];
          break;
        }
      }
      await testApplication.save();
      this.answer(msg.id, "studentAnswer", ret.toJSON(), null);
    } catch (error) {
      this.answer(msg.id, "studentAnswer", null, error);
    }
  }

  get model () {
    return Model;
  }

  get eventName () {
    return 'testApplication';
  }
}