import * as fs from 'fs';
import * as path from 'path';

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
const baseURL = `http://localhost:${config.server.port}`;

describe('6.1.CollaborativeWork', () => {

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

  describe('CRUD collaborative work', () => {

    describe('Create', () => {

      describe('with drive file and external link', () => {

        const actionIndex = 25;
        let collaborativeWork, rootChildren, entity;

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

          it('create basic collaborativeWork', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: "trabalho colaborativo com arquivo do drive"
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(collaborativeWork => {
                  expect(collaborativeWork).to.be.instanceOf(Object);
                  expect(collaborativeWork).to.have.all.keys("public", "removed", "owner", "entityId", "name", "answer", "id", "createdAt", "updatedAt", "externalLink", "file");
                });
                collaborativeWork = response.body.data[0];
                done();
              });
          });

          it('read root', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                rootChildren = response.body.data;
                done();
              });
          });

        });

        describe('TEST', () => {

          it('add drive file', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[3]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkId: collaborativeWork.id,
                fileId: [rootChildren.files[0].id, rootChildren.files[1].id],
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(file => {
                  expect(file).to.be.instanceOf(Object);
                  expect(file).to.have.all.keys("name", "extension", "date", "size", "id");
                });
                done();
              });
          });

          it('add drive link', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkId: collaborativeWork.id,
                linkId: [rootChildren.externalLinks[0].id],
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(file => {
                  expect(file).to.be.instanceOf(Object);
                  expect(file).to.have.all.keys("name", "extension", "date", "size", "id");
                });
                done();
              });
          });

        });

      });

      describe('with local file and link', () => {

        let entity;
        const actionIndex = 25;
        let collaborativeWork;

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

          it('create basic collaborativeWork', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: "trabalho colaborativo com arquivo"
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(collaborativeWork => {
                  expect(collaborativeWork).to.be.instanceOf(Object);
                  expect(collaborativeWork).to.have.all.keys("public", "removed", "owner", "entityId", "name", "answer", "id", "createdAt", "updatedAt", "externalLink", "file");
                });
                collaborativeWork = response.body.data[0];
                done();
              });
          });

        });

        describe('TEST', () => {

          it('attach local file', (done) => {
            const fileName = "arquivoLocalTC.xlsx";
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}/${fileName}/${collaborativeWork.id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('localFile', fs.readFileSync(path.resolve(`test/files/${fileName}`)), fileName)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "extension", "date", "size");
                done();
              });
          });

          it('create link on collaborative work', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[5]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWork: collaborativeWork.id,
                externalLink: {
                  name: 'Link do trabalho colaborativo',
                  link: 'https://link/tabalho/colaborativo',
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                done();
              });
          });

        });

      });

      describe('create collaborative work', () => {

        let entity;
        const actionIndex = 25;

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

          it('create with restrict time to visibility and answered collaborativeWork', (done) => {
            const
              currentDate = new Date(),
              initAnswerDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes() + 1).getTime(),
              endAnswerDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes()).getTime();
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: "trabalho colaborativo restricao de visibilidade e resposta",
                initVisibilityDate: initAnswerDate,
                endVisibilityDate: endAnswerDate,
                initAnswerDate,
                endAnswerDate,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(collaborativeWork => {
                  expect(collaborativeWork).to.be.instanceOf(Object);
                  expect(collaborativeWork).to.have.all.keys("public", "removed", "owner", "entityId", "name", "initVisibilityDate", "endVisibilityDate", "answer", "id", "createdAt", "updatedAt", "externalLink", "file");
                });
                done();
              });
          });

          it('create with restrict time to answered collaborativeWork', (done) => {
            const
              currentDate = new Date(),
              initAnswerDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes() + 1).getTime(),
              endAnswerDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes()).getTime();
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: "trabalho colaborativo restricao de resposta",
                initAnswerDate,
                endAnswerDate,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(collaborativeWork => {
                  expect(collaborativeWork).to.be.instanceOf(Object);
                  expect(collaborativeWork).to.have.all.keys("public", "removed", "owner", "entityId", "name", "answer", "id", "createdAt", "updatedAt", "externalLink", "file");
                });
                done();
              });
          });

          it('create with restrict visibilityDate collaborativeWork', (done) => {
            const
              currentDate = new Date(),
              initVisibilityDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes() + 1).getTime(),
              endVisibilityDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes()).getTime();
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: "trabalho colaborativo restricao de visibilidade",
                initVisibilityDate,
                endVisibilityDate,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(collaborativeWork => {
                  expect(collaborativeWork).to.be.instanceOf(Object);
                  expect(collaborativeWork).to.have.all.keys("public", "removed", "owner", "entityId", "name", "initVisibilityDate", "endVisibilityDate", "answer", "id", "createdAt", "updatedAt", "externalLink", "file");
                });
                done();
              });
          });

          it('create basic collaborativeWork', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: "trabalho colaborativo 1",           
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(collaborativeWork => {
                  expect(collaborativeWork).to.be.instanceOf(Object);
                  expect(collaborativeWork).to.have.all.keys("public", "removed", "owner", "entityId", "name", "answer", "id", "createdAt", "updatedAt", "externalLink", "file");
                });
                done();
              });
          });

        });

      });

    });

    describe('Read', () => {

      describe('download file', () => {

        let entity;
        const actionIndex = 27;
        let collaborativeWork;

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

          it('read all available collaborative work', (done) => {
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

          it('download', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                collaborativeWorkId: collaborativeWork.id,
                fileId: collaborativeWork.file[0].id,
              })
              .end((error, response) => {
                expect(response.status).to.equal(200);
                done();
              });
          });

        });

      });

      describe('read available collaborative work', () => {

        let entity;
        const actionIndex = 27;

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

          it('read all available collaborative work', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                done();
              });
          });

        });

      });

      describe('read all collaborative work', () => {

        let entity;
        const actionIndex = 26;

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
                done();
              });
          });

        });

      });

    });

    describe('Update', () => {

      describe('update external link', () => {

        let entity;
        const actionIndex = 28;
        let collaborativeWork;

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

          it('read all available collaborative work', (done) => {
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
                  if (response.body.data[i].externalLink.length) {
                    collaborativeWork = response.body.data[i];
                    break;
                  }
                }
                done();
              });
          });

        });

        describe('TEST', () => {

          it('update external link', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[3]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: collaborativeWork.id,
                linkId: collaborativeWork.externalLink[0],
                update: {
                  name: "Link Atualizado",
                  link: "http://novolink.com/algo/aqui"
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("id", "externalLink");
                expect(response.body.data.externalLink).to.be.instanceOf(Array);
                response.body.data.externalLink.forEach(link => {
                  expect(link).to.have.all.keys("_id", "link", "name");
                });
                done();
              });
          });

        });

      });

      describe('remove file and link', () => {

        let entity;
        const actionIndex = 28;
        let collaborativeWork;

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

          it('read all available collaborative work', (done) => {
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

          it('remove file', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[4]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: collaborativeWork.id,
                fileId: collaborativeWork.file[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "id", "file");
                done();
              });
          });

          it('remove link', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[8]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: collaborativeWork.id,
                linkId: collaborativeWork.externalLink[0],
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "id", "file");
                done();
              });
          });

        });

      });

      describe('update answer infos', () => {

        let entity;
        const actionIndex = 28;
        let collaborativeWork, cbTestMPT;

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

          it('read all available collaborative work', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                cbTestMPT = response.body.data[1];
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

          it('update initialTime and endTime', (done) => {
            const currentTime = new Date(),
              initialDate = currentTime.getTime(),
              endDate = new Date(currentTime.getFullYear(), currentTime.getMonth() + 1).getTime();

            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: collaborativeWork.id,
                update: {
                  initialDate,
                  endDate,
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("maxPerTeam", "initialDate", "endDate", "id");
                done();
              });
          });

          it('update maxPerTeam', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: cbTestMPT.id,
                update: {
                  maxPerTeam: 5
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("maxPerTeam", "initialDate", "endDate", "id");
                done();
              });
          });

        });

      });

      describe('update infos', () => {

        let entity;
        const actionIndex = 28;
        let collaborativeWork;

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

          it('read all available collaborative work', (done) => {
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

          const currentTime = new Date(),
            initTime = currentTime.getTime(),
            endTime = new Date(currentTime.getFullYear(), currentTime.getMonth() + 1).getTime();

          it('update initVisibilityDate and endVisibilityDate', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: collaborativeWork.id,
                update: {
                  initVisibilityDate: initTime,
                  endVisibilityDate: endTime,
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("public", "name", "initVisibilityDate", "endVisibilityDate", "id");
                done();
              });
          });

          it('update name, description and public', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: collaborativeWork.id,
                update: {
                  name: 'nome mudado',
                  description: "descrição mudada",
                  public: true,
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("public", "name", "description", "initVisibilityDate", "endVisibilityDate", "id");
                done();
              });
          });

        });

      });

    });

    describe('Delete', () => {

      describe('delete collaborative work', () => {

        let entity;
        const actionIndex = 29;
        let collaborativeWork;

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

          it('remove collaborativeWork', (done) => {
            chai.request(baseURL)
              .post(`/api/collaborativeWork/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: collaborativeWork.id,
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