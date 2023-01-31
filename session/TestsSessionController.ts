import * as BBPromise from "bluebird";
import {BasicHandler} from '../handlers/BasicHandler'
import {Types} from "mongoose";
import {FindObject} from '../handlers/util/FindObject';
import {TestSession} from './testsSession/TestSession';

export class TestsSessionController extends BasicHandler {
  private readonly _testsMap;
  private readonly _name: string;
  private _minutesLimit: number;

  constructor({minutesLimit, io}: { minutesLimit: number, io: any }) {
    super();
    io.on('connect', this.ioConnect.bind(this));
    this.minutesLimit = minutesLimit;
    this._testsMap = new Map();
    this._name = "testsSessionController";
    this.wiring();
  }

  private get minutesLimit(): number {
    return this._minutesLimit;
  }

  private set minutesLimit(minutesLimit: number) {
    this._minutesLimit = minutesLimit;
  }

  private get name() {
    return this._name;
  }

  private getDateToEnter(): { currentDate: Date, dateLimit: Date } {
    let currentDate = new Date();
    return {
      currentDate,
      dateLimit: new Date(currentDate.getTime() + (this.minutesLimit * (60 * 1000))),
    };
  }

  private getQueryInitialDate() {
    let date = this.getDateToEnter();
    return {
      $gt: date.currentDate,
      // $lte: date.dateLimit,
    }
  }

  private ioConnect(socket) {
    console.log('chegou aqui', JSON.stringify(socket.handshake.query));
    socket.on('doFront', (msg)=>{
      console.log('msg', msg);
    });
    this[`ioConnect_${socket.handshake.query.userType}`](socket);
  }

  private async ioConnect_student(socket) {
    let test = await this.getStudentTest(socket.handshake.query.entityId);
    this._testsMap.get(test.data.success.id).setStudentIO({
      studentId: socket.handshake.query.studentId,
      socket
    });
  }

  private async ioConnect_monitor(socket) {
    this._testsMap.get(socket.handshake.query.testId).setMonitorIO({
      monitorId: socket.handshake.query.monitorId,
      peerId: socket.handshake.query.peerId,
      socket
    });
  }

  private async enterMonitorTestSession(msg) {
    if (msg.source_id === this.id) return;
    let ret = await this.sendToServer('db.test.read', new FindObject({
      findOne: true,
      query: {
        monitors: {
          $in: [msg.data.success.monitorId],
        },
        initialDate: this.getQueryInitialDate()
      },
      select: 'entityId endDate initialDate monitors students id',
      populate: [
        {
          path: 'entityId',
          select: 'id name users'
        },
        {
          path: 'monitors',
          select: 'id'
        },
        {
          path: 'students',
          select: 'id'
        }
      ],
    }));
    if (ret.data.error) return this.answer(msg.id, msg.event, null, ret.data.error);
    if (!ret.data.error && !ret.data.success) return this.answer(msg.id, msg.event, null, "hasNoTestBefore10Minutes");
    if (this._testsMap.has(ret.data.success.id)) return this.answer(msg.id, msg.event, ret.data.success, null);
    this._testsMap.set(ret.data.success.id, new TestSession(ret.data.success));
    return this.answer(msg.id, msg.event, ret.data.success, null);
  }

  private removeTest(msg){
    if(msg.source_id === this.id) return;
    this._testsMap.delete(msg.data.success);
  }

  private async enterStudentTestSession(msg) {
    if (msg.source_id === this.id) return;
    let ret = await this.getStudentTest(msg.data.success.entityId);
    if(ret.data.error) return this.answer(msg.id, msg.event, null, ret.data.error);
    if(!ret.data.success && !ret.data.error) return this.answer(msg.id, msg.event, null, 'hasNoTest');
    // if(!this._testsMap.get(ret.data.success.id).isOpen()) return this.answer(msg.id, msg.event, null, 'testStartedAlready');
    let enter = this._testsMap.get(ret.data.success.id).studentEnter({studentId: msg.data.success.studentId});
    if (!enter) return this.answer(msg.id, msg.event, null, 'studentNotFind');
    return this.answer(msg.id, msg.event, ret.data.success, null);
  }

  private async studentGetTest(msg) {
    if (msg.source_id === this.id) return;
    let test = await this._testsMap.get(msg.data.success.testId).studentGetTest({studentId: msg.data.success.studentId});
    if (!test) return this.answer(msg.id, msg.event, null, 'waitTest');
    return this.answer(msg.id, msg.event, test, null);
  }

  private async studentAnswer(msg) {
    if (msg.source_id === this.id) return;
    if(!this._testsMap.get(msg.data.success.testId)) return this.handlerNoTest(msg);
    let question = await this._testsMap.get(msg.data.success.testId).studentAnswer({
      studentId: msg.data.success.studentId,
      questionId: msg.data.success.questionId,
      answers: msg.data.success.answers
    });
    if (!question) return this.answer(msg.id, msg.event, null, 'cantUpdateAnswer');
    return this.answer(msg.id, msg.event, question, null);
  }

  private async handlerNoTest(msg){
    let ret = await this.sendToServer('db.test.read', new FindObject({
      query: msg.data.success.testId,
      select: 'endDate'
    }));
    if(ret.data.error || !ret.data.success) return this.answer(msg.id, msg.event, null, 'testNotExist');
    let endTime = new Date(ret.data.success.endDate).getTime();
    let currentTime = new Date().getTime();
    if(currentTime > endTime) return this.answer(msg.id, msg.event, null, 'testNotAvailable');
    return this.answer(msg.id, msg.event, null, 'testIsNotMapped');
  }

  private async getStudentTest(entityId) {
    return this.sendToServer('db.test.read', new FindObject({
      findOne: true,
      query: {
        entityId: {
          $in: entityId,
        },
        endDate: this.getQueryInitialDate(),
        // initialDate: this.getQueryInitialDate(),
      },
      select: 'endDate id initialDate instructions title',
    }));
  }

  protected sendToServer(event, dado): BBPromise<any> {
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
  answer(messageId, event, success, error) {
    let data = {
      success: success,
      error: error
    };
    this.hub.send(this, event, data, messageId);
  }

  wiring() {
    this.hub.on(`${this.name}.enterMonitor`, this.enterMonitorTestSession.bind(this));
    this.hub.on(`${this.name}.enterStudent`, this.enterStudentTestSession.bind(this));
    this.hub.on(`${this.name}.studentGetTest`, this.studentGetTest.bind(this));
    this.hub.on(`${this.name}.studentAnswer`, this.studentAnswer.bind(this));
    this.hub.on(`${this.name}.removeTest`, this.removeTest.bind(this));
  }
}