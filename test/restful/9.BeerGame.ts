import * as path from 'path';
import {TestManager} from '../TestManager';

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
let testManager = null;
const baseURL = `http://localhost:${config.server.port}`;

describe('2.Register', () => {

    let loggedUser;
  
    describe("before", () => {
      require('./3.1.ManagementAPI_privileges');
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
            expect(error).to.be.null;
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

    describe('Register', () => {

        let entity;
        const actionIndex = 42;
      
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
        
        describe('User register by platform', () => {

            describe('TEST', () => {

                it('OK', (done) => {
                    chai.request(baseURL)
                    .post(`/api/platform/${entity.privileges.actions[actionIndex].methods[0]}`)
                    .set('platform-key', "5fa93fc258821729e4d47ad7")
                    .send({
                        id: loggedUser.id,
                        educationalInstitution: 'Udesc',
                    })
                    .end((error, response) => {
                        expect(response.body).to.be.instanceof(Object);
                        expect(response.body).to.have.all.keys("success", "data");
                        expect(response.body.success).to.be.true;
                        expect(response.body.data).to.be.instanceof(Object);
                        expect(response.body.data).to.have.all.keys("_id", "userType", "name", "surname", "email", "educationalInstitution", "platformKey", "id");
                        done();
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