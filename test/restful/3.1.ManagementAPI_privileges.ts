import {TestManager} from '../TestManager';
import * as path from 'path'

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
let testManager = null;
const baseURL = `http://localhost:${config.server.port}`;

describe('3.Management - Privileges', () => {

  let loggedUser;

  before((done) => {
    testManager = new TestManager(done);
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

  describe('CRUD privileges', () => {

    describe('Create', () => {

      describe('read modules', () => {

        let entity;

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

          it('OK', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[0].id}/${entity.privileges.actions[0].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(module => {
                  expect(module).to.be.instanceOf(Object);
                  expect(module).to.have.all.keys("actions", "label", "id");
                  expect(module.actions).to.be.instanceOf(Array);
                  module.actions.forEach(action => {
                    expect(action).to.be.instanceOf(Object);
                    expect(action).to.have.all.keys("_id", "methods", "label", "name", "id");
                    expect(action.methods).to.be.instanceOf(Array);
                  });
                });
                done();
              })
          });

        });

      });

      describe('create', () => {

        let entity;
        let modules;

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

          it('Read modules', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[0].id}/${entity.privileges.actions[0].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                entityId: entity.id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(module => {
                  expect(module).to.be.instanceOf(Object);
                  expect(module).to.have.all.keys("actions", "label", "id");
                  expect(module.actions).to.be.instanceOf(Array);
                  module.actions.forEach(action => {
                    expect(action).to.be.instanceOf(Object);
                    expect(action).to.have.all.keys("_id", "methods", "label", "name", "id");
                    expect(action.methods).to.be.instanceOf(Array);
                  });
                });
                modules = response.body.data;
                done();
              });
          });

        });

        describe('TEST', () => {

          it('OK', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[0].id}/${entity.privileges.actions[0].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                label: "privilege-1",
                actions: modules[0].actions,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(privilege => {
                  expect(privilege).to.be.instanceOf(Object);
                  expect(privilege).to.have.all.keys("actions", "removed", "label", "id", "createdAt", "updatedAt");
                  expect(privilege.actions).to.be.instanceOf(Array);
                });
                done();
              })
          });

          it('OK', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[0].id}/${entity.privileges.actions[0].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                label: "privilege - roremove",
                actions: modules[0].actions,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(privilege => {
                  expect(privilege).to.be.instanceOf(Object);
                  expect(privilege).to.have.all.keys("actions", "removed", "label", "id", "createdAt", "updatedAt");
                  expect(privilege.actions).to.be.instanceOf(Array);
                });
                done();
              })
          });

        });

      });

    });

    describe('Read', () => {

      describe('read all', () => {

        let entity;

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

          it('OK', (done) => {
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
                done();
              })
          });

        });

      });

    });

    describe('Update', () => {

      describe('update', () => {

        let entity;
        let modules;
        let privileges;

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

          it('Read all modules', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[2].id}/${entity.privileges.actions[2].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(module => {
                  expect(module).to.be.instanceOf(Object);
                  expect(module).to.have.all.keys("actions", "label", "id");
                  expect(module.actions).to.be.instanceOf(Array);
                  module.actions.forEach(action => {
                    expect(action).to.be.instanceOf(Object);
                    expect(action).to.have.all.keys("_id", "methods", "label", "name", "id");
                    expect(action.methods).to.be.instanceOf(Array);
                  });
                });
                modules = response.body.data;
                done();
              });
          });

          it('Read all privileges', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[2].id}/${entity.privileges.actions[2].methods[1]}`)
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
                privileges = response.body.data;
                done();
              })
          });

        });

        describe('TEST', () => {

          it('update actions', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[2].id}/${entity.privileges.actions[2].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: privileges[1].id,
                update: {
                  actions: [modules[0].actions[0], modules[0].actions[1], modules[0].actions[1]],
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("actions", "label", "id");
                expect(response.body.data.actions).to.be.instanceOf(Array);
                done();
              })
          });

          it('update label', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[2].id}/${entity.privileges.actions[2].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: privileges[1].id,
                update: {
                  label: "Nome trocado",
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("actions", "label", "id");
                expect(response.body.data.actions).to.be.instanceOf(Array);
                done();
              })
          });

          it('update label and actions', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[2].id}/${entity.privileges.actions[2].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: privileges[1].id,
                update: {
                  label: "Nome trocado",
                  actions: [modules[0].actions[1], modules[0].actions[1]],
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("actions", "label", "id");
                expect(response.body.data.actions).to.be.instanceOf(Array);
                done();
              })
          });

        });

      });

    });

    describe('Delete', () => {

      describe('delete', () => {

        let entity;
        let privileges;
        const actionIndex = 19;

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

          it('Read all privileges', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
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
                privileges = response.body.data;
                done();
              })
          });

        });

        describe('TEST', () => {

          it('OK', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: privileges[privileges.length - 1].id,
              })
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