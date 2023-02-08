import * as fs from 'fs';
import * as path from 'path';

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
const baseURL = `http://localhost:${config.server.port}`;

describe('6.2.CollaborativeWorkAnswer', () => {

  const binaryParser = function (res, cb) {
    res.setEncoding('binary');
    res.data = '';
    res.on("data", function (chunk) {
      res.data += chunk;
    });
    res.on('end', function () {
      const buffer = new Buffer(res.data, 'binary');
      cb(null, buffer);
    });
  };

  let loggedUser;

  describe("before", () => {
    require('./6.1.CollaborativeWork');
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

  describe('CRUD collaborative work answer', () => {

    describe('Read', () => {

      describe('read collaborative work answer detail', () => {

        let
          entity,
          collaborativeWorks;
        const actionIndex = 30;

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

          it('read available collaborative work', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(collaborativeWork => {
                  expect(collaborativeWork).to.be.instanceOf(Object);
                });
                collaborativeWorks = response.body.data;
                done();
              });
          });

        });

        describe('TEST', () => {

          it('read answer detail', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkId: collaborativeWorks[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(answer => {
                  expect(answer).to.be.instanceOf(Object);
                  expect(answer).to.be.have.all.keys("_id", "collaborativeWorkAnswerId", "maxPerTeam", "teamId", "endDate", "initialDate");
                });
                done();
              });
          });

        });

      });

    });

    describe('Create', () => {

      describe('create collaborative work answer', () => {

        let
          entity,
          collaborativeWorks,
          collaborativeWorkToAnswer,
          team,
          teamTwo,
          userEntity,
          userPrivileges;
        const actionIndex = 30;

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

          it('read available collaborative work', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(collaborativeWork => {
                  expect(collaborativeWork).to.be.instanceOf(Object);
                });
                collaborativeWorks = response.body.data;
                done();
              });
          });

          it('read answer detail', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkId: collaborativeWorks[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(answer => {
                  expect(answer).to.be.instanceOf(Object);
                  expect(answer).to.be.have.all.keys("_id", "collaborativeWorkAnswerId", "maxPerTeam", "teamId", "endDate", "initialDate");
                });
                collaborativeWorkToAnswer = response.body.data[0];
                done();
              });
          });

          it('read user in entity', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[11].id}/${entity.privileges.actions[11].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: loggedUser._id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("entities", "id");
                expect(response.body.data.entities).to.be.instanceOf(Array);
                response.body.data.entities.forEach(userEntity => {
                  expect(userEntity).to.be.instanceOf(Object);
                  expect(userEntity).to.have.all.keys("entity", "privileges", "date");
                  expect(userEntity.entity).to.be.instanceOf(Object);
                  if(userEntity.entity.firstName) expect(userEntity.entity).to.have.all.keys("_id", "visible", "activate", "name", "firstName", "id");
                  else expect(userEntity.entity).to.have.all.keys("_id", "visible", "activate", "name", "id");
                  expect(userEntity.privileges).to.be.instanceOf(Object);
                  expect(userEntity.privileges).to.have.all.keys("_id", "label", "id");
                });
                userEntity = response.body.data.entities[0];
                done();
              })
          });

          it('read privileges user in entity', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[1].id}/${entity.privileges.actions[1].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(privilege => {
                  expect(privilege).to.be.instanceOf(Object);
                  expect(privilege).to.have.all.keys("actions", "label", "id");
                  expect(privilege.actions).to.be.instanceOf(Array);
                  privilege.actions.forEach(action => {
                    expect(action).to.be.instanceOf(Object);
                    expect(action).to.have.all.keys("_id", "label", "name", "id");
                  });
                });
                userPrivileges = response.body.data[0];
                done();
              })
          });

        });

        describe('TEST', () => {

          it('create answer', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[3]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkAnswerId: collaborativeWorkToAnswer.collaborativeWorkAnswerId,
                answer: {
                  title: 'Osvaldo',
                  comment: 'Minha resposta',
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("_id", "participants", "answer");
                team = response.body.data;
                done();
              });
          });

          it('create other answer', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[3]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkAnswerId: collaborativeWorkToAnswer.collaborativeWorkAnswerId,
                answer: {
                  title: 'Outra Resposta',
                  comment: 'nova resposta de um novo time',
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("_id", "participants", "answer");
                team = response.body.data;
                done();
              });
          });

          it('create team', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[25].id}/${entity.privileges.actions[25].methods[4]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkAnswerId: collaborativeWorkToAnswer.collaborativeWorkAnswerId,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(team => {
                  expect(team).to.be.instanceOf(Object);
                  expect(team).to.have.all.keys("_id", "participants", "answers");
                });
                teamTwo = response.body.data;
                done();
              });
          });

          it('create participant in team', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[28].id}/${entity.privileges.actions[28].methods[6]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkAnswerId: collaborativeWorkToAnswer.collaborativeWorkAnswerId,
                teamId: teamTwo[2]._id,
                participantId: "5e4147f1cb6de716f4b92678",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.true;
                done();
              });
          });

          it('attach answer file', (done) => {
            const fileName = "class.xlsx";
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[4]}/${collaborativeWorkToAnswer.collaborativeWorkAnswerId}/${team._id}/${team.answer._id}/${fileName}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('localFile', fs.readFileSync(path.resolve(`test/files/${fileName}`)), fileName)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.true;
                done();
              });
          });

          it('update answer data', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[5]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkAnswerId: collaborativeWorkToAnswer.collaborativeWorkAnswerId,
                teamId: team._id,
                answerId: team.answer._id, // opcional
                answer: {
                  title: 'Titulo',
                  comment: 'Outra resposta',
                },
                userLabel: userEntity.privileges.label, // opcional
                userActions: userPrivileges.actions, // opcional
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.true;
                done();
              });
          });

          it('update teacher answer data', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[5]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkAnswerId: collaborativeWorkToAnswer.collaborativeWorkAnswerId,
                teamId: teamTwo[2]._id,
                answer: {
                  title: 'Titulo teste',
                  comment: 'Resposta teste do Levi',
                },
                userLabel: 'Professor', // opcional
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.true;
                done();
              });
          });

          it('attach another answer file', (done) => {
            const fileName = "class.xlsx";
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[4]}/${collaborativeWorkToAnswer.collaborativeWorkAnswerId}/${team._id}/${team.answer._id}/${fileName}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('localFile', fs.readFileSync(path.resolve(`test/files/${fileName}`)), fileName)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.true;
                done();
              });
          });

          it('update participants in team', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[28].id}/${entity.privileges.actions[28].methods[6]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkAnswerId: collaborativeWorkToAnswer.collaborativeWorkAnswerId,
                teamId: team._id,
                participantId: "610c1d11ac489fa5813edaae",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.true;
                done();
              });
          });

        });

        describe('AFTER', () => {

          it('read answer detail', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkId: collaborativeWorks[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(answer => {
                  expect(answer).to.be.instanceOf(Object);
                  expect(answer).to.be.have.all.keys("_id", "collaborativeWorkAnswerId", "maxPerTeam", "teamId", "endDate", "initialDate", "participants", "answers");
                });
                done();
              });
          });

        });

      });

    });

    describe('Delete', () => {

      describe('delete teams data', () => {

        let entity;
        const actionIndex = 28;
        let collaborativeWork,
            collaborativeWorks,
            answers;

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

          it('read available collaborative work', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[30].id}/${entity.privileges.actions[30].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(collaborativeWork => {
                  expect(collaborativeWork).to.be.instanceOf(Object);
                });
                collaborativeWorks = response.body.data;
                done();
              });
          });

          it('read answer detail', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[30].id}/${entity.privileges.actions[30].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkId: collaborativeWorks[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(answer => {
                  expect(answer).to.be.instanceOf(Object);
                  expect(answer).to.be.have.all.keys("_id", "collaborativeWorkAnswerId", "maxPerTeam", "teamId", "endDate", "initialDate", "participants", "answers");
                });
                answers = response.body.data[0].answers;
                done();
              });
          });

          it('read all collaborative work', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                for (let i = 0; i < response.body.data.length; i++) {
                  if (response.body.data[i].file) {
                    collaborativeWork = response.body.data[i];
                    break;
                  }
                }
                done();
              });
          });

        });

        describe('TEST', () => {

          it('remove answer', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[5]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                answerId: collaborativeWork.answer.id, // id de resposta do TB
                answer: answers.filter(resp => resp.comment === 'Outra resposta')[0]._id, // id da resposta no time
                teamId: collaborativeWork.answer.teams[1]._id, // id do time
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                done();
              });
          });

          it('remove participant', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[7]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                answerId: collaborativeWork.answer.id, // id de resposta do TB
                teamId: collaborativeWork.answer.teams[1]._id, // id do time
                participantId: collaborativeWork.answer.teams[1].participants[0]._id, // id do participant
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                done();
              });
          });

        });

      });

    });

  });

  describe('Collaborative work answer correct', () => {

    describe('Read', () => {

      describe('read collaborative work answer read sent', () => {

        let
          entity,
          collaborativeWorks,
          userEntity;
        const actionIndex = 34;

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

          it('read all collaborative work', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                collaborativeWorks = response.body.data;
                done();
              });
          });

          it('read user in entity', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[11].id}/${entity.privileges.actions[11].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: loggedUser._id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("entities", "id");
                expect(response.body.data.entities).to.be.instanceOf(Array);
                response.body.data.entities.forEach(userEntity => {
                  expect(userEntity).to.be.instanceOf(Object);
                  expect(userEntity).to.have.all.keys("entity", "privileges", "date");
                  expect(userEntity.entity).to.be.instanceOf(Object);
                  if(userEntity.entity.firstName) expect(userEntity.entity).to.have.all.keys("_id", "visible", "activate", "name", "firstName", "id");
                  else expect(userEntity.entity).to.have.all.keys("_id", "visible", "activate", "name", "id");
                  expect(userEntity.privileges).to.be.instanceOf(Object);
                  expect(userEntity.privileges).to.have.all.keys("_id", "label", "id");
                });
                userEntity = response.body.data.entities[0];
                done();
              })
          });

        });

        describe('TEST', () => {

          it('read answer detail', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[30].id}/${entity.privileges.actions[30].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkId: collaborativeWorks[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(answer => {
                  expect(answer).to.be.instanceOf(Object);
                  expect(answer).to.have.all.keys("_id", "maxPerTeam", "teamId", "initialDate", "endDate", "collaborativeWorkAnswerId");
                  expect(answer.teamId).to.be.instanceOf(Array);
                });
                done();
              });
          });

          it('read sent answers', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkId: collaborativeWorks[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("answer");
                expect(response.body.data.answer).to.be.instanceOf(Object);
                expect(response.body.data.answer).to.have.all.keys("_id", "maxPerTeam", "id", "teams");
                done();
              });
          });

          it('read available answers', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[30].id}/${entity.privileges.actions[30].methods[7]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkAnswerId: collaborativeWorks[0].answer.id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                done();
              });
          });

          it('download file answer', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[30].id}/${entity.privileges.actions[30].methods[6]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkAnswerId: collaborativeWorks[0].answer.id,
                teamId: collaborativeWorks[0].answer.teams[1]._id,
                answerId: collaborativeWorks[0].answer.teams[1].answers[0]._id,
                fileId: collaborativeWorks[0].answer.teams[1].answers[0].files[0]._id,
              })
              .end((error, response) => {
                expect(response.status).to.equal(200);
                done();
              });
          });

          it('download answers zip', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkId: collaborativeWorks[0].id,
              })
              .buffer()
              .parse(binaryParser)
              .end((error, response) => {
                expect(response.status).to.equal(200);
                // fs.writeFileSync(path.resolve("test/files/answers.zip"), response.body);
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