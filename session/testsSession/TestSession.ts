import * as BBPromise from "bluebird";
import {BasicHandler} from '../../handlers/BasicHandler'
import {FindObject} from "../../handlers/util/FindObject";
import {Util} from '../../util/Util';

export class TestSession extends BasicHandler {
  private readonly _monitorMap;
  private readonly _initialDate: Date;
  private readonly _testId: string;
  private readonly _endDate: Date;
  private _intervalTest;
  private _intervalEndTest;

  constructor (data) {
    super();
    this._monitorMap = new Map();
    this.setMonitorMap({monitors: data.monitors});
    this.studentDistributionByMonitor({
      monitors: data.monitors,
      students: data.students
    });
    this._testId = data.id;
    this._initialDate = new Date(data.initialDate);
    this._endDate = new Date(data.endDate);
    this.initTest();

  }

  private setMonitorMap ({monitors}) {
    for (let i = 0; i < monitors.length; i++) this._monitorMap.set(monitors[i].id, {students: new Map()});
  }

  private studentDistributionByMonitor ({monitors, students}) {
    let m = 0;
    for (let i = 0; i < students.length; i++) {
      this._monitorMap.get(monitors[m].id).students.set(students[i].id, {present: false});
      m++;
      if(m === monitors.length) m = 0;
    }
  }

  private getMonitorSessionByStudentId (studentId) {
    for (let monitor of this._monitorMap.values()) {
      if(monitor.students.has(studentId)) return monitor;
    }
  }

  private getStudentById (studentId) {
    return this.getMonitorSessionByStudentId(studentId).students.get(studentId);
  }

  public studentEnter (data: { studentId: string }) {
    let monitor = this.getMonitorSessionByStudentId(data.studentId);
    if(monitor) {
      monitor.students.get(data.studentId).present = true;
      return true;
    }
    return false;
  }

  public isOpen () {
    let currentTime = new Date().getTime();
    console.log('this._initialDate.getTime() <= currentTime && currentTime <= this._endDate.getTime()', this._initialDate.getTime() <= currentTime && currentTime <= this._endDate.getTime())
    return this._initialDate.getTime() <= currentTime && currentTime <= this._endDate.getTime();
    // let currentTime = new Date().getTime();
    // const extraTime = 60000 * 10;
    // return this._initialDate.getTime() >= (currentTime - extraTime);
  }

  public setStudentIO ({studentId, socket}: { studentId: string, socket: any }) {
    let monitor = this.getMonitorSessionByStudentId(studentId);
    if(monitor) {
      monitor.students.get(studentId).socketIO = socket;
      monitor.socketIO.emit("enterStudent", studentId);
      socket.emit('monitorPeerId', monitor.peerId);
    }
  }

  public setMonitorIO ({monitorId, socket, peerId}: { monitorId: string, socket: any, peerId: any }) {
    let monitor = this._monitorMap.get(monitorId);
    monitor[`socketIO`] = socket;
    monitor[`peerId`] = peerId;
  }

  public initTest () {
    console.log('no initTest');
    this._intervalTest = setInterval(() => {
      let currentTime = new Date().getTime();
      console.log('verificando se já startou');
      if(currentTime >= this._initialDate.getTime()) {
        console.log('iniciando o test');
        for (let monitor of this._monitorMap.values()) {
          if(monitor.socketIO) {
            monitor.socketIO.emit('testInit', {testId: this._testId});
            for (let student of monitor.students.values()) {
              if(student.present) student.socketIO.emit('testInit', {testId: this._testId});
            }
          }
        }
        this.setIntervalEndTest();
        clearInterval(this._intervalTest);
      }
    }, 1000);
  }

  private setIntervalEndTest () {
    this._intervalEndTest = setInterval(() => {
      let currentTime = new Date().getTime();
      if(currentTime > this._endDate.getTime()) this.destroySession();
    }, 10000)
  }

  private async destroySession () {
    clearInterval(this._intervalEndTest);
    await this.clearSocketIO();
    this.sendToServer('testsSessionController.removeTest', this._testId);
    super.destroy();
  }

  private async clearSocketIO () {
    let promises = [];
    for (let monitor of this._monitorMap.values()) {
      promises.push(this.clearStudentSocketIO(monitor.students));
      promises.push(this.disconnectMonitor(monitor));
    }
    await Promise.all(promises);
    this.clearMaps();
  }

  private disconnectMonitor (monitor) {
    if(!monitor.socketIO) return;
    monitor.socketIO.disconnect(true)
  }

  private clearMaps () {
    for (let monitor of this._monitorMap.values()) {
      monitor.students.clear();
    }
    this._monitorMap.clear();
  }

  private async clearStudentSocketIO (students) {
    for (let student of students.values()) {
      if(student.socketIO) student.socketIO.disconnect(true);
    }
  }

  public async studentGetTest ({studentId}: { studentId: string }) {
    if(!this.isOpen()) return false;
    if(!this.isOnTest({studentId})) return false;
    let ret = await this.sendToServer('db.test.read', new FindObject({
      query: this._testId,
      select: 'questions',
    }));
    let test: any = await this.toShakeTest({test: ret.data.success, studentId});
    let testApplication = {
      test: test.test,
      student: test.student,
      answers: [],
    };
    let questionsMap = new Map();
    for (let i = 0; i < test.questions.length; i++) {
      let testAnswer = {
        title: test.questions[i].title,
        body: test.questions[i].body,
        weight: test.questions[i].weight,
        questionType: test.questions[i].questionType,
        _id: test.questions[i].id,
      };
      testApplication.answers.push(testAnswer);
      questionsMap.set(testAnswer._id, testAnswer);
    }
    let testApplicationBD = await this.sendToServer('db.testApplication.create', testApplication);
    let student = this.getStudentById(studentId);
    student['testApplication'] = {
      id: testApplicationBD.data.success[0].id,
      questionsMap
    };
    test['id'] = testApplicationBD.data.success[0].id;
    return test;
  }

  public async studentAnswer ({studentId, questionId, answers}: studentAnswer) {
    if(!this.isOnTest({studentId})) return false;
    let student = this.getStudentById(studentId);
    let question = student.testApplication.questionsMap.get(questionId);
    question['answers'] = answers;
    let ret = await this.sendToServer('db.testApplication.studentAnswer', {
      testApplicationId: student.testApplication.id,
      questionId,
      answers
    });
    if(ret.data.error || !ret.data.success) {
      return false;
    }
    return ret.data.success;
  }

  private async toShakeTest ({test, studentId}: { test: any, studentId: string }) {
    let testApplication = {
      test: this._testId,
      student: studentId,
      questions: await this.toShakeQuestions({questions: test.questions}),
    };
    return testApplication;
  }

  private async toShakeQuestions ({questions}: { questions: [any] }) {
    let promises = [];
    for (let i = 0; i < questions.length; i++) {
      if(questions[i].questionType === "summation") promises.push(this.orderAnswers(questions[i]));
      else promises.push(this.shakeAnswers(questions[i]));
    }
    let shakedQuestions = await Promise.all(promises);
    await Util.arrayShuflle(shakedQuestions);
    return shakedQuestions;
  }

  private async getBasicOfQuestion (question) {
    let ret = {
      title: question.title,
      body: question.body,
      answers: [],
      grade: 0,
      weight: question.weight,
      questionType: question.questionType,
      id: question._id.toString(),
    };
    if(question.questionType !== 'dissertation') {
      if((question.correctAnswers && question.correctAnswers.length) && (question.incorrectAnswers && question.incorrectAnswers.length)) ret.answers = question.correctAnswers.concat(question.incorrectAnswers);
      else if(question.correctAnswers.length) ret.answers = question.correctAnswers;
      else ret.answers = question.incorrectAnswers;
    }
    return ret;
  }

  private async orderAnswers (question) {
    let orderQuestion = await this.getBasicOfQuestion(question);
    orderQuestion.answers.sort(function (a, b) {
      if(a.order > b.order) return 1;
      else return -1;
    });
    return orderQuestion;
  };

  private async shakeAnswers (question) {
    let shakedQuestion = await this.getBasicOfQuestion(question);
    if(shakedQuestion.questionType === 'dissertation') return shakedQuestion;
    await Util.arrayShuflle(shakedQuestion.answers);
    return shakedQuestion;
  };

  private isOnTest ({studentId}: { studentId: string }) {
    let monitorSession = this.getMonitorSessionByStudentId(studentId);
    return !!monitorSession;
  }

  protected sendToServer (event, dado): BBPromise<any> {
    return this.hub.send(this, event, {success: dado, error: null,}).promise;
  }

  /**
   *
   * @param messageId
   * @param event
   * @param success
   * @param error
   *
   * Make a answer to a message represented for a messageId param.
   */
  answer (messageId, event, success, error) {
    let data = {
      success: success,
      error: error
    };
    this.hub.send(this, event, data, messageId);
  }

}

interface studentAnswer {
  studentId: string,
  questionId: string,
  answers: Answer,
}

interface Answer {
  _id?: string,
  order?: number,
  text: string,
}