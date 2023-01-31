import * as path from 'path';
import {TestManager} from '../TestManager';

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
let testManager = null;
const baseURL = `http://localhost:${config.server.port}`;

describe('2.User', () => {

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

  describe('User account', () => {

    describe('Read entities', () => {

      let userEntities;
      let entities;

      describe('read', () => {

        describe('TEST', () => {

          it('OK', (done) => {
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
                done();
              })
          });

        });

      });

      describe('read children', () => {

        describe('BEFORE', () => {

          it('Read entities', (done) => {
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
                userEntities = response.body.data;
                done();
              })
          });

        });

        describe('TEST', () => {

          it('Primeira camada', (done) => {
            chai.request(baseURL)
              .get(`/api/user/entity/children/${userEntities[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(entity => {
                  expect(entity).to.be.instanceOf(Object);
                  expect(entity).to.have.all.keys("_id", "children", "name", "id");
                });
                entities = response.body.data;
                done();
              })
          });

          it('Segunda camada', (done) => {
            chai.request(baseURL)
              .get(`/api/user/entity/children/${entities[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(entity => {
                  expect(entity).to.be.instanceOf(Object);
                  expect(entity).to.have.all.keys("_id", "children", "name", "id");
                });
                entities = response.body.data;
                done();
              })
          });

        });

      });

      describe('read modules', () => {

        describe('TEST', () => {

          it('OK', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entities[0].id}/${userEntities[0].privileges.actions[0].id}/${userEntities[0].privileges.actions[0].methods[0]}`)
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

    });

    describe('User account', () => {

      describe('change password', () => {

        describe('TEST', () => {

          it('OK', (done) => {
            chai.request(baseURL)
              .post(`/api/user/password`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                currentPassword: "admin",
                newPassword: "admintrocado",
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

        describe('AFTER', () => {

          it('LOGOUT', (done) => {
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

          it('LOGIN', (done) => {
            chai.request(baseURL)
              .post("/api/login/hoken")
              .send({
                login: 'admin@admin.com',
                password: 'admintrocado'
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

          it('change password', (done) => {
            chai.request(baseURL)
              .post(`/api/user/password`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                currentPassword: "admintrocado",
                newPassword: "admin",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.true;
                done();
              })
          });

          it('LOGOUT', (done) => {
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

          it('LOGIN', (done) => {
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