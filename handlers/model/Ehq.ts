import {BasicHandler} from "../BasicHandler";
import {FindObject} from "../util/FindObject";
import { UpdateObject } from '../util/UpdateObject';
import * as path from 'path';

export class Ehq extends BasicHandler {

  public async testCreate(param: defaultParam<test>) {
    const
      model = 'test',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", "data",
        [
          "initialDate", "endDate", "title", "monitors", "author", "questions"
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const usersEntity = await this.sendToServer('db.entity.read', new FindObject({
        query: param.entityId,
        select: "users",
        populate: [
          {
            path: 'users',
            select: 'id',
          },
        ]
      }));
      this.checkHubReturn(usersEntity.data);
      const users = usersEntity.data.success.users,
        monitors = param.data.monitors;
      let students = [];
      for (let i = 0; i < users.length ; i++) {
        students.push(users[i].id)
      }
      let indexMonitor, indexTeacher;
      for (let i = 0; i < monitors.length; i++) { // removendo monitors da lista de users da entity
        if(students.includes(monitors[i])){ // verifica se existe o monitor no array de users da entidade
          indexMonitor = students.indexOf(monitors[i]); // pega a posição do monitor no array
          students.splice(indexMonitor, 1); // remove o monitor do array
        }      
      }
      if(students.includes(param.data.author)){ // verifica se existe o professor no array de users da entidade
        indexTeacher = students.indexOf(param.data.author); // pega a posição do professor no array
        students.splice(indexTeacher, 1); // remove o professor do array
      }
      const newTest = await this.sendToServer('db.test.create', {
        instructions: param.data.instructions,
        initialDate: param.data.initialDate,
        endDate: param.data.endDate,
        title: param.data.title,
        entityId: param.entityId,
        monitors: param.data.monitors,
        students: students,
        author: param.data.author,
        questions: param.data.questions
      });
      this.checkHubReturn(newTest.data);
      if (newTest.data.success) { // add test na coleção da entidade
        await this.sendToServer(
          'db.entity.update',
          new UpdateObject({
            query: param.entityId,
            update: {
              $addToSet: {
                tests: newTest.data.success[0].id,
              },
            },
          }),
        );
      }
      // console.log(process.env.QUESTIONS_AUTH)
      return await this.returnHandler({
        model,
        data: {success: newTest.data.success},
      });
      } catch (e) {
        return await this.returnHandler({
          model,
          data: {error: e.message || e},
        });
      }
  }

  public async readAllTest(param: defaultParam<null>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId"
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const test = await this.sendToServer('db.test.read', new FindObject({
        query: {
          entityId: param.entityId,
        },
        select: 'instructions initialDate endDate title questions id monitors students author',
        populate: [
          {
            path: 'questions',
            select: 'id title body questionType weight correctAnswers incorrectAnswers author',
          },
        ]
      }));
      return await this.returnHandler({
        model: 'test',
        data: test.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'test',
        data: {error: e.message || e},
      });
    }
  }

  public async testReadPerId(param: defaultParam<{ id: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data", 
      [
        'id'
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let test = await this.sendToServer("db.test.read", new FindObject({
        query: param.data.id,
        select: 'instructions initialDate endDate title questions id monitors students author',
        populate: [
          {
            path: 'questions',
            select: 'id title body questionType weight correctAnswers incorrectAnswers author',
          },
        ]
      }));
      return await this.returnHandler({
        model: 'test',
        data: test.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'test',
        data: {error: e.message || e},
      });
    }
  }

  public async testUpdate(param: defaultParam<{ id: string; update: any }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data", 
      [
        'id', 'update'
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
      let test = await this.sendToServer("db.test.read", new FindObject({
        query: param.data.id,
        select: 'initialDate endDate',
      }),
    );
    if (!this.testTimeValidation({
        initialDate: test.data.success.initialDate,
        endDate: test.data.success.endDate,
      }))
      return await this.returnHandler({
        model: 'test',
        data: { error: 'cantUpdateTest' },
      });
    if (param.data.update.initialDate || param.data.update.endDate) {
      if (
        param.data.update.initialDate &&
        param.data.update.endDate &&
        !this.testTimeValidation({
          initialDate: param.data.update.initialDate,
          endDate: param.data.update.endDate,
        })
      )
        return await this.returnHandler({
          model: 'test',
          data: { error: 'cantUpdateTest' },
        });
      if (
        param.data.update.initialDate &&
        !param.data.update.endDate &&
        !this.testTimeValidation({
          initialDate: param.data.update.initialDate,
          endDate: test.param.data.success.endDate,
        })
      )
        return await this.returnHandler({
          model: 'test',
          data: { error: 'cantUpdateTest' },
        });
      if (
        !param.data.update.initialDate &&
        param.data.update.endDate &&
        !this.testTimeValidation({
          initialDate: test.param.data.success.initialDate,
          endDate: param.data.update.endDate,
        })
      )
        return await this.returnHandler({
          model: 'test',
          data: { error: 'cantUpdateTest' },
        });
    }
    let ret = await this.sendToServer('db.test.update', new UpdateObject({
        query: param.data.id,
        update: this.getUpdateObject(['endDate', 'initialDate', 'instructions', 'title'], param.data.update,),
        select: ['endDate', 'initialDate', 'instructions', 'title', 'id'],
      }),
    );
    return await this.returnHandler({
      model: 'test',
      data: ret.data,
    });
  }

  private testTimeValidation({ initialDate, endDate }) {
    let limit = require(path.resolve('config.json')).test.minutesLimit;
    let initialDateTime = new Date(initialDate).getTime();
    let endDateTime = new Date(endDate).getTime();
    if (endDateTime < initialDateTime) return false;
    let currentTime = new Date().getTime();
    return currentTime + 60000 * limit <= initialDateTime;
  }

  public async removeTest(param: defaultParam<{ id: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "id"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const test = await this.sendToServer('db.test.update', new UpdateObject({
        query: param.data.id,
        update: {
          removed: true,
        },
        select: ['id', 'removed']
      }));
      return await this.returnHandler({
        model: 'test',
        data: test.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'test',
        data: {error: e.message || e},
      });
    }
  }

  public async testDelete(param: defaultParam<{ id: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "id"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const ret = await this.sendToServer('db.test.delete', new FindObject({
        query: param.data.id,
      }));
      return await this.returnHandler({
        model: 'test',
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'test',
        data: {error: e.message || e},
      });
    }
  }

  public async monitorReadTest(param: defaultParam<{ monitorId: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "monitorId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    let ret = await this.sendToServer('db.test.read', new FindObject({
      query: {
        removed: false,
        monitors: {
          $in: [param.data.monitorId],
        }
      },
      select: 'endDate initialDate instructions title',
    }));
    return await this.returnHandler({
      model: 'test',
      data: ret.data,
    })
  }

  public async monitorTestEnter(param: defaultParam<{ monitorId: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "monitorId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    let ret = await this.sendToServer('testsSessionController.enterMonitor', {monitorId: param.data.monitorId});
    if(ret.data.success) {
      delete ret.data.success.entityId;
      delete ret.data.success.monitors;
      delete ret.data.success.students;
    }
    return await this.returnHandler({
      model: 'test',
      data: ret.data,
    })
  }

  public async studentGetClasses(param: defaultParam<{ studentId: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "studentId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    let ret = await this.sendToServer('db.entity.read', new FindObject({
      query: {
        removed: false,
        users: {
          $in: [param.data.studentId],
        }
      },
      select: 'name id',
    }));
    return await this.returnHandler({
      model: 'test',
      data: ret.data,
    })
  }

  public async studentTestEnter(param: defaultParam<{ studentId: string }>) { // tratar erro se monitor não autorizou ainda
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "studentId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    let ret = await this.sendToServer('testsSessionController.enterStudent', {
      studentId: param.data.studentId,
      entityId: param.entityId
    });
    return await this.returnHandler({
      model: 'test',
      data: ret.data,
    })
  }

  public async studentGetTest(param: defaultParam<{ studentId: string, testId: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "studentId", "testId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    let ret = await this.sendToServer('testsSessionController.studentGetTest', {
      studentId: param.data.studentId,
      testId: param.data.testId
    });
    return await this.returnHandler({
      model: 'test',
      data: ret.data,
    })
  }

  public async studentQuestionAnswer(param: defaultParam<questionAnswer>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "studentId", "testId", "questionId", "answers"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    let ret = await this.sendToServer('testsSessionController.studentAnswer', {
      studentId: param.data.studentId,
      questionId: param.data.questionId,
      answers: param.data.answers,
      testId: param.data.testId
    });
    return await this.returnHandler({
      model: 'testApplication',
      data: ret.data,
    })
  }

  public async teacherTestRead(param: defaultParam<{ teacherId: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "teacherId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    let ret = await this.sendToServer('db.entity.read',  new FindObject({
      findOne: true,
        query: param.entityId,
        select: 'id name tests',
        populate: [
          {
            path: 'tests',
            select: 'initialDate endDate id instructions title questions' 
          }
        ],
      }),
    );
    return await this.returnHandler({
      model: 'test',
      data: ret.data,
    });
  }

  public async teacherTestApplicationRead(param: defaultParam<{ testId: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "testId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    let test = await this.sendToServer('db.test.read',  new FindObject({
        query: param.data.testId,
        select: 'entityId endDate id initialDate monitors students questions',
        populate: [
          {
            path: 'entityId',
            select: 'id name',
          },
          {
            path: 'monitors',
            select: 'email id name surname',
          },
          {
            path: 'students',
            select: 'email id name surname',
          }
        ],
      }),
    );
    let testApplication = await this.sendToServer('db.testApplication.read',  new FindObject({
        query: {
          test: param.data.testId,
        },
        select: 'answers id student grade',
        populate: [
          {
            path: 'student',
            select: 'email name surname id',
          },
        ],
      }),
    );
    if (!testApplication.data.success || testApplication.data.error)
      return await this.returnHandler({
        model: 'testApplication',
        data: { error: 'readError' },
      });
    test = this.formatApplicationTest(
      test.data.success,
      testApplication.data.success,
    );
    return await this.returnHandler({
      model: 'testApplication',
      data: { success: { test } },
    });
  }

  private formatApplicationTest(test, testApplication) {
    let mapStudents = new Map();
    for (let i = 0; i < testApplication.length; i++) {
      mapStudents.set(testApplication[i].student.id, testApplication[i]);
    }
    for (let j = 0; j < test.students.length; j++) {
      test.students[j] = mapStudents.get(
        test.students[j].id,
      );
    }
    return test;
  }

}

export default new Ehq();

interface defaultParam<T> {
  auth: string,
  aKey: string,
  entityId: string,
  data: T,
}

interface answer {
  text: string;
  order: number;
}

interface question {
  title?: string;
  body: string;
  questionType: string;
  correctAnswers: [answer];
  incorrectAnswers?: [answer];
  author: string;
}

interface test {
  instructions?: string;
  initialDate: string;
  endDate: string;
  title: string;
  questions: [question];
  monitors: [string];
  author: string;
}

interface questionAnswer {
  questionId: string,
  answers: answerText,
  studentId: string,
  testId: string,
}

interface answerText {
  _id?: string,
  text: string,
  order?: number
}