import * as path from 'path'

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
const io = require('socket.io-client');
const baseURL = `http://localhost:${config.server.port}`;

describe('8.EHQ', () => {

  let loggedUsers = [], loggedStudents = [];

  describe("before", () => {
    require('./3.1.ManagementAPI_privileges');
  });

  describe('LOGIN ADMIN', () => {

    it('OK', (done) => {
      chai.request(baseURL)
        .post("/api/login/hoken")
        .send({
          login: 'admin@admin.com',
          password: 'admin'
        })
        .end((error, response) => {
          expect(error).to.be.null;
          expect(response.body).to.be.instanceof(Object);
          expect(response.body).to.have.all.keys("success", "data");
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.instanceof(Object);
          expect(response.body.data).to.have.all.keys("_id", "name", "surname", "birthday", "email", "matriculation", "document", "id", "accessKey", "authenticationKey", "drive");
          expect(response.body.data.document).to.be.instanceOf(Object);
          expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
          loggedUsers.push(response.body.data);
          done();
        })
    });

  });

  describe('CRUD Test', () => {

    let tests, entity, users;
  
    describe('BEFORE', () => {
  
      it('Read entity', (done) => {
        chai.request(baseURL)
          .get("/api/user/entities")
          .set('authentication-key', loggedUsers[0].authenticationKey)
          .set('access-key', loggedUsers[0].accessKey)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceOf(Array);
            response.body.data.forEach(entity => {
              expect(entity).to.be.instanceOf(Object);
              expect(entity).to.have.all.keys("_id", "children", "name", "id", "privileges");
              expect(entity.children).to.be.instanceOf(Array);
              expect(entity.privileges).to.be.instanceOf(Object);
              expect(entity.privileges).to.have.all.keys("_id", "actions", "label", "id");
              expect(entity.privileges.actions).to.be.instanceOf(Array);
              entity.privileges.actions.forEach(action => {
                expect(action).to.be.instanceOf(Object);
                expect(action).to.have.all.keys("_id", "methods", "label", "id", "name");
              });
            });
            entity = response.body.data[0];
            done();
          });
      });
  
      it('read all user', (done) => {
        chai.request(baseURL)
          .post(`/api/management/${entity.id}/${entity.privileges.actions[11].id}/${entity.privileges.actions[11].methods[3]}`)
          .set('authentication-key', loggedUsers[0].authenticationKey)
          .set('access-key', loggedUsers[0].accessKey)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            users = response.body.data;
            done();
          })
      });

      it('Create Student', (done) => {
        chai.request(baseURL)
          .post(`/api/management/${entity.id}/${entity.privileges.actions[10].id}/${entity.privileges.actions[10].methods[2]}`)
          .set('authentication-key', loggedUsers[0].authenticationKey)
          .set('access-key', loggedUsers[0].accessKey)
          .send({
            name: 'Levi',
            surname: 'O estudante',
            birthday: new Date(1998, 3, 15).getTime(),
            email: "levi@student.com",
            password: '123456',
            matriculation: '0987654321',
            document: {
              documentType: 'CPF',
              documentNumber: '0146111052938',
            },
            entities: [
              {
                entity: "5de991c539a92eec6b7b02b1",
                privileges: "5de991c51da356b213614e85",
              }
            ]
          })
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceOf(Array);
            response.body.data.forEach(user => {
              expect(user).to.be.instanceOf(Object);
              expect(user).to.have.all.keys("name", "surname", "birthday", "email", "matriculation", "document", "entities", "id", "emails");
              expect(user.document).to.be.instanceOf(Object);
              expect(user.document).to.have.all.keys("documentType", "documentNumber", "id");
              expect(user.entities).to.be.instanceOf(Array);
              user.entities.forEach(userEntity => {
                expect(userEntity).to.be.instanceOf(Object);
                expect(userEntity).to.have.all.keys("date", "entity", "privileges");
              });
            });
            done();
          })
      });

      it('Create other student', (done) => {
        chai.request(baseURL)
          .post(`/api/management/${entity.id}/${entity.privileges.actions[10].id}/${entity.privileges.actions[10].methods[2]}`)
          .set('authentication-key', loggedUsers[0].authenticationKey)
          .set('access-key', loggedUsers[0].accessKey)
          .send({
            name: 'Andrew',
            surname: 'Estudante',
            birthday: new Date(1998, 3, 15).getTime(),
            email: "andrew@student.com",
            password: '123456',
            matriculation: '1087654321',
            document: {
              documentType: 'CPF',
              documentNumber: '98111052938',
            },
            entities: [
              {
                entity: "5de991c539a92eec6b7b02b1",
                privileges: "5de991c51da356b213614e85",
              }
            ]
          })
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceOf(Array);
            response.body.data.forEach(user => {
              expect(user).to.be.instanceOf(Object);
              expect(user).to.have.all.keys("name", "surname", "birthday", "email", "matriculation", "document", "entities", "id", "emails");
              expect(user.document).to.be.instanceOf(Object);
              expect(user.document).to.have.all.keys("documentType", "documentNumber", "id");
              expect(user.entities).to.be.instanceOf(Array);
              user.entities.forEach(userEntity => {
                expect(userEntity).to.be.instanceOf(Object);
                expect(userEntity).to.have.all.keys("date", "entity", "privileges");
              });
            });
            done();
          })
      });
  
    });

    describe('Create', () => {

      describe('TEST', () => {

        it('Test Create', (done) => { // cria teste simples
          const
            currentDate = new Date(),
            initTestDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes() + 3),
            endTestDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes() + 8);
          chai.request(baseURL)
            .post(`/api/ehq/${entity.id}/${entity.privileges.actions[35].id}/${entity.privileges.actions[35].methods[0]}`)
            .set('authentication-key', loggedUsers[0].authenticationKey)
            .set('access-key', loggedUsers[0].accessKey)
            .send({
              instructions: 'Instruções opcionais para o teste',
              initialDate: initTestDate,
              endDate: endTestDate,
              title: "Prova do Levi",
              questions: [
                {
                  title: 'Título da Questão opcional',
                  body: 'Corpo da Questão',
                  questionType: 'objective',
                  weight: 1,
                  correctAnswers: [{text: 'Resposta correta'}],
                  incorrectAnswers: [{text: 'Resposta incorreta 1'},{text:  'Resposta incorreta 2'}],
                  author: users[0].id,
                },
                {
                  title: 'Futebol',
                  body: 'Qual o melhor time do mundo?',
                  questionType: 'objective',
                  weight: 1,
                  correctAnswers: [{text: 'Fortaleza'}],
                  incorrectAnswers: [{text: 'Ceará'},{text:  'Flamengo'},{text:  'Corinthians'}],
                  author: users[0].id,
                }
              ],
              monitors: [users[1].id, users[2].id],
              author: users[0].id,
            })
            .end((error, response) => {
              expect(response.body).to.be.instanceof(Object);
              expect(response.body).to.have.all.keys("success", "data");
              expect(response.body.success).to.be.true;
              expect(response.body.data).to.be.instanceOf(Array);
              response.body.data.forEach(teste => {
                expect(teste).to.be.instanceOf(Object);
                expect(teste).to.have.all.keys("author", "createdAt", "endDate", "entityId", "id", "initialDate", "instructions", "monitors", "questions", "removed", "students", "title", "updatedAt");
              });
              done();
            })
        });

        it('Test Create toUpdate', (done) => { // cria teste para fazer atualizações
          const
            currentDate = new Date(),
            initTestDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes()),
            endTestDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate(), currentDate.getHours() + 2, currentDate.getMinutes());
          chai.request(baseURL)
            .post(`/api/ehq/${entity.id}/${entity.privileges.actions[35].id}/${entity.privileges.actions[35].methods[0]}`)
            .set('authentication-key', loggedUsers[0].authenticationKey)
            .set('access-key', loggedUsers[0].accessKey)
            .send({
              instructions: 'Primeiras Instruções para o teste',
              initialDate: initTestDate,
              endDate: endTestDate,
              title: "Prova teste",
              questions: [
                {
                  title: 'Título teste',
                  body: 'Corpo da Questão teste',
                  questionType: 'objective',
                  weight: 1,
                  correctAnswers: [{text: 'Resposta correta'}],
                  incorrectAnswers: [{text: 'Resposta incorreta 1'},{text:  'Resposta incorreta 2'}],
                  author: users[0].id,
                }
              ],
              monitors: [users[1].id, users[2].id],
              author: users[0].id,
            })
            .end((error, response) => {
              expect(response.body).to.be.instanceof(Object);
              expect(response.body).to.have.all.keys("success", "data");
              expect(response.body.success).to.be.true;
              expect(response.body.data).to.be.instanceOf(Array);
              response.body.data.forEach(teste => {
                expect(teste).to.be.instanceOf(Object);
                expect(teste).to.have.all.keys("author", "createdAt", "endDate", "entityId", "id", "initialDate", "instructions", "monitors", "questions", "removed", "students", "title", "updatedAt");
              });
              done();
            })
        });

      });

    });

    describe('Read', () => {

      describe('read all tests', () => { // lendo todos os testes criado na entidade

        it('ok', (done) => {
          chai.request(baseURL)
            .post(`/api/ehq/${entity.id}/${entity.privileges.actions[36].id}/${entity.privileges.actions[36].methods[0]}`)
            .set("authentication-key", loggedUsers[0].authenticationKey)
            .set("access-key", loggedUsers[0].accessKey)
            .end((error, response) => {
              expect(response.body).to.be.instanceof(Object);
              expect(response.body).to.have.all.keys("success", "data");
              tests = response.body.data;
              done();
            })
        });

      });

      describe('read by id', () => { // lendo um teste pelo id

        it('ok', (done) => {
          chai.request(baseURL)
            .post(`/api/ehq/${entity.id}/${entity.privileges.actions[36].id}/${entity.privileges.actions[36].methods[1]}`)
            .set("authentication-key", loggedUsers[0].authenticationKey)
            .set("access-key", loggedUsers[0].accessKey)
            .send({id: tests[0].id})
            .end((error, response) => {
              expect(response.body).to.be.instanceof(Object);
              expect(response.body).to.have.all.keys("success", "data");
              done();
            })
        });

      });

    });

    describe('Update', () => {

      describe('update all', () => {

        it('ok', (done) => {
          const
            currentDate = new Date(),
            initTestDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours() + 1, currentDate.getMinutes()),
            endTestDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours() + 2, currentDate.getMinutes());
          chai.request(baseURL)
          .post(`/api/ehq/${entity.id}/${entity.privileges.actions[37].id}/${entity.privileges.actions[37].methods[0]}`)
            .set("authentication-key", loggedUsers[0].authenticationKey)
            .set("access-key", loggedUsers[0].accessKey)
            .send({
              id: tests[1].id,
              update: {
                initialDate: initTestDate,
                endDate: endTestDate,
                title: 'Titulo trocado',
                instructions: 'Instrução trocada',
              },
            })
            .end((error, response) => {
              expect(response.body).to.be.instanceof(Object);
              expect(response.body).to.have.all.keys("success", "data");
              expect(response.body.success).to.be.true;
              expect(response.body.data).to.be.instanceof(Object);
              expect(response.body.data).to.have.all.keys("instructions", "initialDate", "endDate", "title", "id");
              tests[1] = response.body.data;
              done();
            })
        });

      });

    });

    describe('Delete', () => {

      describe('Remove test', () => { // removed = true

        it('ok', (done) => {
          chai.request(baseURL)
          .post(`/api/ehq/${entity.id}/${entity.privileges.actions[38].id}/${entity.privileges.actions[38].methods[1]}`)
            .set("authentication-key", loggedUsers[0].authenticationKey)
            .set("access-key", loggedUsers[0].accessKey)
            .send({id: tests[1].id})
            .end((error, response) => {
              expect(response.body).to.be.instanceof(Object);
              expect(response.body).to.have.all.keys("success", "data");
              expect(response.body.success).to.be.true;
              expect(response.body.data).to.be.instanceOf(Object);
              expect(response.body.data).to.have.all.keys("id", "removed");
              expect(response.body.data.removed).to.be.true;
              done();
            })
        });

      });

      describe('delete not started', () => { // Deleta do BD

        it('ok', (done) => {
          chai.request(baseURL)
          .post(`/api/ehq/${entity.id}/${entity.privileges.actions[38].id}/${entity.privileges.actions[38].methods[0]}`)
            .set("authentication-key", loggedUsers[0].authenticationKey)
            .set("access-key", loggedUsers[0].accessKey)
            .send({id: tests[1].id})
            .end((error, response) => {
              expect(response.body).to.be.instanceof(Object);
              expect(response.body).to.have.all.keys("success", "data");
              expect(response.body.success).to.be.true;
              expect(response.body.data).to.be.instanceof(Object);
              done();
            })
        });

      });

    });

  });

  describe('LOGIN MONITORS', () => {

    it('Login do monitor 1', (done) => { // login do monitor LabTIC
      chai.request(baseURL)
        .post("/api/login/hoken")
        .send({
          login: 'labtic@admin.com',
          password: 'admin'
        })
        .end((error, response) => {
          expect(response.body).to.be.instanceof(Object);
          expect(response.body).to.have.all.keys("success", "data");
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.instanceof(Object);
          expect(response.body.data).to.have.all.keys("_id", "name", "surname", "birthday", "email", "matriculation", "document", "id", "accessKey", "authenticationKey", "drive");
          expect(response.body.data.document).to.be.instanceOf(Object);
          expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
          loggedUsers.push(response.body.data);
          done();
        })
    });

    it('Login do monitor 2', (done) => { // login do monitor Levi
      chai.request(baseURL)
        .post("/api/login/hoken")
        .send({
          login: 'levi@admin.com',
          password: 'admin'
        })
        .end((error, response) => {
          expect(response.body).to.be.instanceof(Object);
          expect(response.body).to.have.all.keys("success", "data");
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.instanceof(Object);
          expect(response.body.data).to.have.all.keys("_id", "name", "surname", "birthday", "email", "matriculation", "document", "id", "accessKey", "authenticationKey", "drive");
          expect(response.body.data.document).to.be.instanceOf(Object);
          expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
          loggedUsers.push(response.body.data);
          done();
        })
    });

  });

  describe('Monitor Actions', () => {
  
    let entityMonitor1, entityMonitor2;

    describe('BEFORE', () => {

      it('Monitor1 Read entity', (done) => {
        chai.request(baseURL)
          .get("/api/user/entities")
          .set('authentication-key', loggedUsers[1].authenticationKey)
          .set('access-key', loggedUsers[1].accessKey)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceOf(Array);
            response.body.data.forEach(entity => {
              expect(entity).to.be.instanceOf(Object);
              expect(entity).to.have.all.keys("_id", "children", "name", "id", "privileges");
              expect(entity.children).to.be.instanceOf(Array);
              expect(entity.privileges).to.be.instanceOf(Object);
              expect(entity.privileges).to.have.all.keys("_id", "actions", "label", "id");
              expect(entity.privileges.actions).to.be.instanceOf(Array);
              entity.privileges.actions.forEach(action => {
                expect(action).to.be.instanceOf(Object);
                expect(action).to.have.all.keys("_id", "methods", "label", "id", "name");
              });
            });
            entityMonitor1 = response.body.data[0];
            done();
          });
      });

      it('Monitor2 Read entity', (done) => {
        chai.request(baseURL)
          .get("/api/user/entities")
          .set('authentication-key', loggedUsers[2].authenticationKey)
          .set('access-key', loggedUsers[2].accessKey)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceOf(Array);
            response.body.data.forEach(entity => {
              expect(entity).to.be.instanceOf(Object);
              expect(entity).to.have.all.keys("_id", "children", "name", "id", "privileges");
              expect(entity.children).to.be.instanceOf(Array);
              expect(entity.privileges).to.be.instanceOf(Object);
              expect(entity.privileges).to.have.all.keys("_id", "actions", "label", "id");
              expect(entity.privileges.actions).to.be.instanceOf(Array);
              entity.privileges.actions.forEach(action => {
                expect(action).to.be.instanceOf(Object);
                expect(action).to.have.all.keys("_id", "methods", "label", "id", "name");
              });
            });
            entityMonitor2 = response.body.data[0];
            done();
          });
      });

    });

    describe('ReadTestToMonitors', ()=>{

      describe('read', ()=>{

        it('monitor 1', (done) => { // Monitor do Labtic lê as instruções da prova
          chai.request(baseURL)
          .post(`/api/ehq/${entityMonitor1.id}/${entityMonitor1.privileges.actions[39].id}/${entityMonitor1.privileges.actions[39].methods[0]}`)
          .set("authentication-key", loggedUsers[1].authenticationKey)
          .set("access-key", loggedUsers[1].accessKey)
          .send({monitorId: loggedUsers[1].id})
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Array);
            response.body.data.forEach(test=>{
              expect(test).to.be.instanceof(Object);
              expect(test).to.have.all.keys("instructions","initialDate","endDate","title");
            });
            done();
          })
        });

        it('monitor 2', (done) => {
          chai.request(baseURL)
          .post(`/api/ehq/${entityMonitor2.id}/${entityMonitor2.privileges.actions[39].id}/${entityMonitor2.privileges.actions[39].methods[0]}`)
          .set("authentication-key", loggedUsers[2].authenticationKey)
          .set("access-key", loggedUsers[2].accessKey)
          .send({monitorId: loggedUsers[2].id})
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Array);
            response.body.data.forEach(test=>{
              expect(test).to.be.instanceof(Object);
              expect(test).to.have.all.keys("instructions","initialDate","endDate","title");
            });
            done();
          })
        });

      });

    });

    describe('TestEnter(monitoring)', ()=>{

      describe('confirm presence', ()=>{

        it('monitor 1', (done) => {
          chai.request(baseURL)
          .post(`/api/ehq/${entityMonitor1.id}/${entityMonitor1.privileges.actions[39].id}/${entityMonitor1.privileges.actions[39].methods[1]}`)
            .set("authentication-key", loggedUsers[1].authenticationKey)
            .set("access-key", loggedUsers[1].accessKey)
            .send({monitorId: loggedUsers[1].id})
            .end((error, response) => {
              expect(response.body).to.be.instanceof(Object);
              expect(response.body).to.have.all.keys("success", "data");
              expect(response.body.success).to.be.true;
              expect(response.body.data).to.be.instanceof(Object);
              expect(response.body.data).to.have.all.keys("initialDate","endDate","id");
              loggedUsers[1]["testInfo"] = response.body.data;
              loggedUsers[1]["siom"] = io(baseURL, {
                path: '/testEnter',
                query: {
                  monitorId: loggedUsers[1].id,
                  testId: loggedUsers[1].testInfo.id,
                  userType: 'monitor',
                }
              });
              loggedUsers[1]["siom"].on('connect', () => {
                console.log("monitor 1 testEnter ok")
                done();
              });
              loggedUsers[1]["siom"].on('enterStudent', (data)=>{
                console.log('event esterStudent', data);
              });
              loggedUsers[1]["siom"].on('testInit', (data)=>{
                console.log('event testInit', data);
              });
              loggedUsers[1]["siom"].connect();
            })
        });

        it('monitor 2', (done) => {
          chai.request(baseURL)
          .post(`/api/ehq/${entityMonitor2.id}/${entityMonitor2.privileges.actions[39].id}/${entityMonitor2.privileges.actions[39].methods[1]}`)
            .set("authentication-key", loggedUsers[2].authenticationKey)
            .set("access-key", loggedUsers[2].accessKey)
            .send({monitorId: loggedUsers[2].id})
            .end((error, response) => {
              expect(response.body).to.be.instanceof(Object);
              expect(response.body).to.have.all.keys("success", "data");
              expect(response.body.success).to.be.true;
              expect(response.body.data).to.be.instanceof(Object);
              expect(response.body.data).to.have.all.keys("initialDate","endDate","id");
              loggedUsers[2]["testInfo"] = response.body.data;
              loggedUsers[2]["siom"] = io(baseURL, {
                path: '/testEnter',
                query: {
                  monitorId: loggedUsers[2].id,
                  testId: loggedUsers[2].testInfo.id,
                  userType: 'monitor',
                }
              });
              loggedUsers[2]["siom"].on('connect', () => {
                console.log("monitor 2 testEnter ok")
                done();
              });
              loggedUsers[2]["siom"].on('enterStudent', (data)=>{
                console.log('event esterStudent', data);
              });
              loggedUsers[2]["siom"].on('testInit', (data)=>{
                console.log('event testInit', data);
              });
              loggedUsers[2]["siom"].connect();
            })
        });

      });

    });

  });

  describe('LOGIN Students', () => {

    it('Login do student 1', (done) => {
      chai.request(baseURL)
        .post("/api/login/hoken")
        .send({
          login: 'levi@student.com',
          password: '123456'
        })
        .end((error, response) => {
          expect(response.body).to.be.instanceof(Object);
          expect(response.body).to.have.all.keys("success", "data");
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.instanceof(Object);
          expect(response.body.data).to.have.all.keys("_id", "name", "surname", "birthday", "email", "matriculation", "document", "id", "accessKey", "authenticationKey");
          expect(response.body.data.document).to.be.instanceOf(Object);
          expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
          loggedStudents.push(response.body.data);
          done();
        })
    });

    it('Login do estudante 2', (done) => {
      chai.request(baseURL)
        .post("/api/login/hoken")
        .send({
          login: 'andrew@student.com',
          password: '123456'
        })
        .end((error, response) => {
          expect(response.body).to.be.instanceof(Object);
          expect(response.body).to.have.all.keys("success", "data");
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.instanceof(Object);
          expect(response.body.data).to.have.all.keys("_id", "name", "surname", "birthday", "email", "matriculation", "document", "id", "accessKey", "authenticationKey");
          expect(response.body.data.document).to.be.instanceOf(Object);
          expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
          loggedStudents.push(response.body.data);
          done();
        })
    });

  });

  describe("Student Actions", () => {
  
    let entityStudent1, entityStudent2, testId;

    describe('BEFORE', () => {

      it('Student1 Read entity', (done) => {
        chai.request(baseURL)
          .get("/api/user/entities")
          .set('authentication-key', loggedStudents[0].authenticationKey)
          .set('access-key', loggedStudents[0].accessKey)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceOf(Array);
            response.body.data.forEach(entity => {
              expect(entity).to.be.instanceOf(Object);
              expect(entity).to.have.all.keys("_id", "children", "name", "id", "privileges");
              expect(entity.children).to.be.instanceOf(Array);
              expect(entity.privileges).to.be.instanceOf(Object);
              expect(entity.privileges).to.have.all.keys("_id", "actions", "label", "id");
              expect(entity.privileges.actions).to.be.instanceOf(Array);
              entity.privileges.actions.forEach(action => {
                expect(action).to.be.instanceOf(Object);
                expect(action).to.have.all.keys("_id", "methods", "label", "id", "name");
              });
            });
            entityStudent1 = response.body.data[0];
            done();
          });
      });

      it('Student2 Read entity', (done) => {
        chai.request(baseURL)
          .get("/api/user/entities")
          .set('authentication-key', loggedStudents[1].authenticationKey)
          .set('access-key', loggedStudents[1].accessKey)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceOf(Array);
            response.body.data.forEach(entity => {
              expect(entity).to.be.instanceOf(Object);
              expect(entity).to.have.all.keys("_id", "children", "name", "id", "privileges");
              expect(entity.children).to.be.instanceOf(Array);
              expect(entity.privileges).to.be.instanceOf(Object);
              expect(entity.privileges).to.have.all.keys("_id", "actions", "label", "id");
              expect(entity.privileges.actions).to.be.instanceOf(Array);
              entity.privileges.actions.forEach(action => {
                expect(action).to.be.instanceOf(Object);
                expect(action).to.have.all.keys("_id", "methods", "label", "id", "name");
              });
            });
            entityStudent2 = response.body.data[0];
            done();
          });
      });

    });

    describe('TestEnter', ()=>{

      describe('Get classes', ()=>{

        it('estudante 1', (done) => {
          chai.request(baseURL)
          .post(`/api/ehq/${entityStudent1.id}/${entityStudent1.privileges.actions[40].id}/${entityStudent1.privileges.actions[40].methods[0]}`)
          .set("authentication-key", loggedStudents[0].authenticationKey)
          .set("access-key", loggedStudents[0].accessKey)
          .send({studentId: loggedStudents[0].id})
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Array);
            response.body.data.forEach(data => {
              expect(data).to.be.instanceof(Object);
              expect(data).to.have.all.keys("name", "id");
            });
            done();
          })
        });

        it('estudante 2', (done) => {
          chai.request(baseURL)
          .post(`/api/ehq/${entityStudent2.id}/${entityStudent2.privileges.actions[40].id}/${entityStudent2.privileges.actions[40].methods[0]}`)
          .set("authentication-key", loggedStudents[1].authenticationKey)
          .set("access-key", loggedStudents[1].accessKey)
          .send({studentId: loggedStudents[1].id})
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Array);
            response.body.data.forEach(data => {
              expect(data).to.be.instanceof(Object);
              expect(data).to.have.all.keys("name", "id");
            });
            testId = response.body.data[0].id;
            done();
          })
        });

      });

      describe('Test enter', () => {

        it('estudantes 1 e 2', (done) => {
          let count = 0;
          for (let i = 0; i < loggedStudents.length; i++) {
            chai.request(baseURL)
            .post(`/api/ehq/${entityStudent1.id}/${entityStudent1.privileges.actions[40].id}/${entityStudent1.privileges.actions[40].methods[1]}`)
            .set("authentication-key", loggedStudents[i].authenticationKey)
            .set("access-key", loggedStudents[i].accessKey)
            .send({studentId: loggedStudents[i].id})
            .end((error, response) => {
              expect(response.body).to.be.instanceof(Object);
              expect(response.body).to.have.all.keys("success", "data");
              expect(response.body.success).to.be.true;
              expect(response.body.data).to.be.instanceof(Object);
              expect(response.body.data).to.have.all.keys("instructions", "initialDate", "endDate", "title", "id");
              loggedStudents[i]["awaitTest"] = response.body.data;
              loggedStudents[i]["siom"] = io(baseURL, {
                path: '/testEnter',
                query: {
                  studentId: loggedStudents[i].id,
                  entityId: entityStudent1.id,
                  userType: 'student',
                }
              });
              loggedStudents[i]["siom"].on('connect', () => {
                count++;
                if (count === loggedStudents.length) done();
              });
              loggedStudents[i]["siom"].connect();
            });
          }  
        });

      });

    });

    describe('Run Test', () => {

      describe('Await start test', () => {

        it('await start test', (done) => {
          let count = 0;
          for (let i = 0; i < loggedStudents.length; i++) {
            loggedStudents[i].siom.on('testInit', msg => {
              loggedStudents[i][`testId`] = msg.testId;
              count++;
              if (count === loggedStudents.length) done();
            });
          }
        });

      });

      describe('Run test', () => {

        it('Students Get Test', (done) => {
          let countStudent = 0;
          for (let i = 0; i < loggedStudents.length; i++) {
            chai.request(baseURL)
            .post(`/api/ehq/${entityStudent1.id}/${entityStudent1.privileges.actions[40].id}/${entityStudent1.privileges.actions[40].methods[2]}`)
            .set("authentication-key", loggedStudents[i].authenticationKey)
            .set("access-key", loggedStudents[i].accessKey)
            .send({
              studentId: loggedStudents[i].id,
              testId: testId
            })
            .end((error, response) => {
              expect(response.body).to.be.instanceof(Object);
              expect(response.body).to.have.all.keys("success", "data");
              expect(response.body.success).to.be.true;
              expect(response.body.data).to.be.instanceof(Object);
              expect(response.body.data).to.have.all.keys("test", "student", "questions", "id");
              expect(response.body.data.questions).to.be.instanceof(Array);
              response.body.data.questions.forEach(question => {
                expect(question).to.be.instanceof(Object);
                expect(question).to.have.all.keys("title", "body", "answers", "grade", "weight", "questionType", "id");
                expect(question.answers).to.be.instanceof(Array);
              });
              loggedStudents[i].id['testApplication'] = response.body.data;
              countStudent++;
              if (loggedStudents.length === countStudent) done();
            });
          }          
        });

      });
      
      describe("Student answer questions", () => {

        let sendAnswer = (student, index = 0) => {
          let data = {
            studentId: loggedStudents[1].id,
            questionId: student.testApplication.questions[index].id,
            testId: testId,
            answers: [],
          };
          if (student.testApplication.questions[index].questionType === "dissertation") data.answers.push({text: `resposta do estudante ${student.name}`});
          else if (student.testApplication.questions[index].questionType === 'objective') data.answers.push(student.testApplication.questions[index].answers[0]);
          else data.answers = student.testApplication.questions[index].answers;
          return new Promise((resolve, reject) => {
            chai.request(baseURL)
              .post(`/api/ehq/${entityStudent1.id}/${entityStudent1.privileges.actions[40].id}/${entityStudent1.privileges.actions[40].methods[3]}`)
              .set("authentication-key", student.authenticationKey)
              .set("access-key", student.accessKey)
              .send(data)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceof(Object);
                expect(response.body.data).to.have.all.keys("title", "body", "weight", "questionType", "answers", "id");
                expect(response.body.data.answers).to.be.instanceof(Array);
                let newIndex = index + 1;
                if (newIndex === student.testApplication.questions.length) return resolve("deu boa");
                else sendAnswer(student, newIndex)
                  .then(ret => {
                    return resolve(ret);
                  });
              });
          });
        };
  
        it('ok', async (done) => {
          let promises = [];
          for (let i = 0; i < loggedStudents.length; i++) {
            promises.push(sendAnswer(loggedStudents[i]));
          }
          await Promise.all(promises);
          done();
        });
  
      });

      describe("Await end test", () => {
  
        it('Ok', (done) => {
          let count = 0;
          for (let i = 0; i < loggedStudents.length; i++) {
            loggedStudents[i].siom.on('disconnect', msg => {
              count++;
              if (count === loggedStudents.length) done();
            });
          }
        });
  
      });

    });

  });

  describe("TEST CORRECTION", () => { // TEACHER é o ADMIN aqui

    let entity, tests;

    describe('BEFORE', () => {

      it('Teacher Read entity', (done) => {
        chai.request(baseURL)
          .get("/api/user/entities")
          .set('authentication-key', loggedUsers[0].authenticationKey)
          .set('access-key', loggedUsers[0].accessKey)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceOf(Array);
            response.body.data.forEach(entity => {
              expect(entity).to.be.instanceOf(Object);
              expect(entity).to.have.all.keys("_id", "children", "name", "id", "privileges");
              expect(entity.children).to.be.instanceOf(Array);
              expect(entity.privileges).to.be.instanceOf(Object);
              expect(entity.privileges).to.have.all.keys("_id", "actions", "label", "id");
              expect(entity.privileges.actions).to.be.instanceOf(Array);
              entity.privileges.actions.forEach(action => {
                expect(action).to.be.instanceOf(Object);
                expect(action).to.have.all.keys("_id", "methods", "label", "id", "name");
              });
            });
            entity = response.body.data[0];
            done();
          });
      });

    });

    describe('Read all tests from entity', () => {

      it('ok', (done) => {
        chai.request(baseURL)
        .post(`/api/ehq/${entity.id}/${entity.privileges.actions[41].id}/${entity.privileges.actions[41].methods[0]}`)
          .set("authentication-key", loggedUsers[0].authenticationKey)
          .set("access-key", loggedUsers[0].accessKey)
          .send({teacherId: loggedUsers[0].id})
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            tests = response.body.data.tests[0];
            done();
          })
      });

    });

    describe('Read testApplication', () => {

      it('ok', (done) => {
        chai.request(baseURL)
        .post(`/api/ehq/${entity.id}/${entity.privileges.actions[41].id}/${entity.privileges.actions[41].methods[1]}`)
        .set("authentication-key", loggedUsers[0].authenticationKey)
        .set("access-key", loggedUsers[0].accessKey)
        .send({testId: tests.id})
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            done();
          })
      });

    });

  });

  describe("LOGOUT ALL USERS", () => {

    it('Logout ADMIN', (done) => {
      chai.request(baseURL)
        .post("/api/user/logout")
        .set('authentication-key', loggedUsers[0].authenticationKey)
        .set('access-key', loggedUsers[0].accessKey)
        .end((error, response) => {
          expect(response.body).to.be.instanceof(Object);
          expect(response.body).to.have.all.keys("success", "data");
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.true;
          done();
        })
    });

    it('Logout MONITOR 1', (done) => {
      chai.request(baseURL)
        .post("/api/user/logout")
        .set('authentication-key', loggedUsers[1].authenticationKey)
        .set('access-key', loggedUsers[1].accessKey)
        .end((error, response) => {
          expect(response.body).to.be.instanceof(Object);
          expect(response.body).to.have.all.keys("success", "data");
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.true;
          done();
        })
    });

    it('Logout MONITOR 2', (done) => {
      chai.request(baseURL)
        .post("/api/user/logout")
        .set('authentication-key', loggedUsers[2].authenticationKey)
        .set('access-key', loggedUsers[2].accessKey)
        .end((error, response) => {
          expect(response.body).to.be.instanceof(Object);
          expect(response.body).to.have.all.keys("success", "data");
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.true;
          done();
        })
    });

    it('Logout STUDENT 1', (done) => {
      chai.request(baseURL)
        .post("/api/user/logout")
        .set('authentication-key', loggedStudents[0].authenticationKey)
        .set('access-key', loggedStudents[0].accessKey)
        .end((error, response) => {
          expect(response.body).to.be.instanceof(Object);
          expect(response.body).to.have.all.keys("success", "data");
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.true;
          done();
        })
    });

    it('Logout STUDENT 2', (done) => {
      chai.request(baseURL)
        .post("/api/user/logout")
        .set('authentication-key', loggedStudents[1].authenticationKey)
        .set('access-key', loggedStudents[1].accessKey)
        .end((error, response) => {
          expect(response.body).to.be.instanceof(Object);
          expect(response.body).to.have.all.keys("success", "data");
          expect(response.body.success).to.be.true;
          expect(response.body.data).to.be.true;
          done();
        })
    });

  });

});