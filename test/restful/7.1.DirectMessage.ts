import * as fs from 'fs';
import * as path from 'path';

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
const baseURL = `http://localhost:${config.server.port}`;

describe('7.1.MalaDireta', () => {

  let loggedUser;

  describe("before", () => {
    require('./4.1.DriveAPI');
  });

  describe('LOGIN', () => {

    it('OK', (done) => {
      chai.request(baseURL)
        .post("/api/login/hoken")
        .send({
          login: 'admin@admin.com',
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
          loggedUser = response.body.data;
          done();
        })
    });

  });

  describe('CRUD mala direta', () => {

    describe('Create', () => {

      describe('create mala direta', () => {

        let entity;
        const actionIndex = 31;
        let users;
        let message, messageWithAttachment

        describe('BEFORE', () => {

          it('Read entity', (done) => {
            chai.request(baseURL)
              .get("/api/user/entities")
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
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

          it('Read user entity', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                page: 1,
                skip: 20,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("count", "users");
                expect(response.body.data.users).to.be.instanceOf(Array);
                users = response.body.data.users
                done();
              })
          });

        });

        describe('TEST', () => {

          it('create message', (done) => {
            const usersTo = users.map(
              user => user.id
            )
            chai.request(baseURL)
              .post(`/api/directMessage/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                sendBy: loggedUser.authenticationKey,
                sendTo: {
                  users: usersTo,
                },
                title: "mala direta",
                subject: {
                  message: "fazendo backend do mala direta"
                },
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array)
                if (response.body.data[0].sendDate) {
                  expect(response.body.data[0]).to.have.keys("createdAt", "id", "removed", "sendBy", "sendDate", "sendTo", "subject", "title", "updatedAt", "hasAttachment")
                } else expect(response.body.data[0]).to.have.keys("createdAt", "sendTo", "removed", "sendBy", "title", "subject", "id", "updatedAt", "hasAttachment")
                expect(response.body.data[0].subject).to.be.instanceOf(Object)
                expect(response.body.data[0].subject).to.have.all.keys("attachments", "message", "id")
                message = {
                  id: response.body.data[0].id,
                  sendDate: response.body.data[0].sendDate
                }
                done();
              });
          });

          it('create message to users in entity', (done) => {
            chai.request(baseURL)
              .post(`/api/directMessage/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                sendBy: loggedUser.authenticationKey,
                sendTo: {          
                  entityId: [entity.id, entity.children[0]],
                },
                title: "Teste email",
                subject: {
                  message: "enviando email para todos usuários dessa entidade"
                },
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array)
                if (response.body.data[0].sendDate) {
                  expect(response.body.data[0]).to.have.keys("createdAt", "id", "removed", "sendBy", "sendDate", "sendTo", "subject", "title", "updatedAt", "hasAttachment")
                } else expect(response.body.data[0]).to.have.keys("createdAt", "sendTo", "removed", "sendBy", "title", "subject", "id", "updatedAt", "hasAttachment")
                expect(response.body.data[0].subject).to.be.instanceOf(Object)
                expect(response.body.data[0].subject).to.have.all.keys("attachments", "message", "id")
                done();
              });
          });

          it('create message with attachment', (done) => {
            const sendTo = users.map(
              user => user.id
            )
            chai.request(baseURL)
              .post(`/api/directMessage/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                sendBy: loggedUser.authenticationKey,
                sendTo: {
                  users: sendTo,
                },
                title: "MALA DIRETA COM ANEXO",
                subject: {
                  message: "tem anexo"
                },
                hasAttachment: true
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                messageWithAttachment = response.body.data[0]
                done();
              });
          });

          it('create attachment', (done) => {
            const fileName = "subjects.xlsx";
            chai.request(baseURL)
              .post(`/api/directMessage/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[3]}/${messageWithAttachment.id}/${fileName}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('localFile', fs.readFileSync(path.resolve(`test/files/${fileName}`)), fileName)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                done();
              });
          });

          it('read user sent emails', (done) => {
            chai.request(baseURL)
              .post(`/api/directMessage/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array)
                response.body.data.forEach(email => {
                  expect(email).to.be.instanceOf(Object);
                  expect(email).to.have.all.keys("sendTo", "title", "subject", "sendDate", "id");
                  expect(email.sendTo).to.be.instanceOf(Array);
                  email.sendTo.forEach(user => {
                    expect(user).to.be.instanceOf(Object);
                    expect(user).to.have.all.keys("_id", "name", "surname", "email", "id");
                  });
                  expect(email.subject).to.be.instanceOf(Object);
                  expect(email.subject).to.have.all.keys("attachments", "_id", "message");
                })
                done();
              });
          });

        });
      });
    });

    describe('Read', () => {

      describe('read mala direta', () => {

        let entity;
        const actionIndex = 32;

        describe('BEFORE', () => {

          it('Read entity', (done) => {
            chai.request(baseURL)
              .get("/api/user/entities")
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
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

        describe('TEST', () => {
          let person;

          it('read user available emails', (done) => {
            chai.request(baseURL)
              .post(`/api/directMessage/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object)
                expect(response.body.data).to.have.keys("emails", "id")
                response.body.data.emails.forEach(email => {
                  expect(email).to.be.instanceOf(Object);
                  expect(email).to.have.all.keys("_id", "sendBy", "title", "subject", "sendDate", "id", "entityId");
                  expect(email.sendBy).to.be.instanceOf(Object);
                  expect(email.sendBy).to.have.all.keys("_id", "name", "surname", "email", "id");
                  expect(email.subject).to.be.instanceOf(Object)
                  expect(email.subject).to.have.all.keys("attachments", "_id", "message");
                });
                person = response.body.data;
                done();
              });
          });

          it('update user read mails', (done) => {
            chai.request(baseURL)
              .post(`/api/directMessage/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                mailId: person.emails[0].id
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object)
                done();
              });
          });

          it('other update user read mails', (done) => {
            chai.request(baseURL)
              .post(`/api/directMessage/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                mailId: person.emails[1].id
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object)
                done();
              });
          });

          it('read all user emails', (done) => {
            chai.request(baseURL)
              .post(`/api/directMessage/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object)
                expect(response.body.data).to.have.keys("emails", "id")
                response.body.data.emails.forEach(email => {
                  expect(email).to.be.instanceOf(Object);
                  expect(email).to.have.all.keys("hasAttachment", "sendBy", "title", "subject", "sendDate", "id");
                  expect(email.sendBy).to.be.instanceOf(Object);
                  expect(email.sendBy).to.have.all.keys("_id", "name", "surname", "email", "id");
                  expect(email.subject).to.be.instanceOf(Object)
                  expect(email.subject).to.have.all.keys("message")
                });
                done();
              });
          });

        });
      });
    });

  });

  describe("LOGOUT", () => {

    it('OK', (done) => {
      chai.request(baseURL)
        .post("/api/user/logout")
        .set('authentication-key', loggedUser.authenticationKey)
        .set('access-key', loggedUser.accessKey)
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