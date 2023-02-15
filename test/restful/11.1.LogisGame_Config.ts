import * as path from 'path';

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
let testManager = null;
const baseURL = `http://localhost:${config.server.port}`;

describe('11.1.LogisGame_Config', () => {

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

    describe('Register and CRUD Setting', () => {

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

        describe('CRUD Setting', () => {

            describe('Read', () => {
        
              it('OK', (done) => {
                chai.request(baseURL)
                  .get(`/api/user/${entity.privileges.actions[actionIndex].methods[3]}`)
                  .set('authentication-key', loggedUser.authenticationKey)
                  .set('access-key', loggedUser.accessKey)
                  .end((error, response) => {
                    expect(response.body).to.be.instanceof(Object);
                    expect(response.body).to.have.all.keys("success", "data");
                    expect(response.body.success).to.be.true;
                    expect(response.body.data).to.be.instanceof(Object);
                    expect(response.body.data).to.have.all.keys("id", "userSettings");
                    done();
                  });
              });
        
            });

            describe('Create/Update', () => {
        
              it('create', (done) => {
                chai.request(baseURL)
                  .post(`/api/user/${entity.privileges.actions[actionIndex].methods[3]}`)
                  .set('authentication-key', loggedUser.authenticationKey)
                  .set('access-key', loggedUser.accessKey)
                  .send({
                    async: false,
                    timer: true,
                    time: 65,
                    isDefault: false,
                    weekAmount: 10,
                    demands: [
                      10,
                      12,
                      14,
                      15,
                      20,
                      50,
                      35,
                      40,
                      50,
                      10,
                      10,
                      12,
                      14,
                      15,
                      20,
                      50,
                      35,
                      40,
                      50,
                      10,
                      10,
                      12,
                      14,
                      15,
                      20,
                      50,
                      35,
                      40,
                      50,
                      10
                    ],
                    productInfos: {
                      name: "Camisa",
                      varegistaPrice: 60,
                      atacadistaPrice: 40,
                      fabricantePrice: 20,
                      productsPerBox: 1,
                      boxesPerPallet: 100
                    },
                    defaultDeliverCost: 3,
                    varegistaOwnStockAvailable: 100,
                    atacadistaOwnStockAvailable: 500,
                    fabricanteOwnStockAvailable: 1500,
                    rentStockCostByPallet: 4,
                    varegistaPenaltyForUndeliveredProduct: 6,
                    atacadistaPenaltyForUndeliveredProduct: 4,
                    atacadistaMultiplicador: 4,
                    fabricantePenaltyForUndeliveredProduct: 2,
                    fabricanteMultiplicador: 4,
                  })
                  .end((error, response) => {
                    expect(response.body).to.be.instanceof(Object);
                    expect(response.body).to.have.all.keys("success", "data");
                    expect(response.body.success).to.be.true;
                    expect(response.body.data).to.be.instanceof(Object);
                    expect(response.body.data).to.have.all.keys("async", "timer", "time", "playersPerTeam", "isDefault", "weekAmount", "demands", "removed", "productInfos", "defaultDeliverCost", "varegistaOwnStockAvailable", "atacadistaOwnStockAvailable", "fabricanteOwnStockAvailable", "rentStockCostByPallet", "varegistaPenaltyForUndeliveredProduct", "atacadistaPenaltyForUndeliveredProduct", "fabricantePenaltyForUndeliveredProduct", "id", "createdAt", "updatedAt", "atacadistaMultiplicador", "fabricanteMultiplicador");
                    done();
                  });
              });
        
              it('update', (done) => {
                chai.request(baseURL)
                  .post(`/api/user/${entity.privileges.actions[actionIndex].methods[3]}`)
                  .set('authentication-key', loggedUser.authenticationKey)
                  .set('access-key', loggedUser.accessKey)
                  .send({
                    async: true,
                    timer: false,
                    time: 80,
                    isDefault: true,
                    weekAmount: 8,
                    demands: [
                      10,
                      12,
                      14,
                      15,
                      20,
                      50,
                      35,
                      40,
                      50,
                      10,
                      10,
                      12,
                      14,
                      15,
                      20,
                      50,
                      35,
                      40,
                      50,
                      10,
                      10,
                      12,
                      14,
                      15,
                      20,
                      50,
                      35,
                      40,
                      50
                    ],
                    productInfos: {
                      name: "Bermuda",
                      varegistaPrice: 120,
                      atacadistaPrice: 80,
                      fabricantePrice: 40,
                      productsPerBox: 1,
                      boxesPerPallet: 50
                    },
                    defaultDeliverCost: 6,
                    varegistaOwnStockAvailable: 10,
                    atacadistaOwnStockAvailable: 50,
                    fabricanteOwnStockAvailable: 150,
                    rentStockCostByPallet: 12,
                    varegistaPenaltyForUndeliveredProduct: 20,
                    atacadistaPenaltyForUndeliveredProduct: 15,
                    fabricantePenaltyForUndeliveredProduct: 10,
                    atacadistaMultiplicador: 3,
                    fabricanteMultiplicador: 6,
                  })
                  .end((error, response) => {
                    expect(response.body).to.be.instanceof(Object);
                    expect(response.body).to.have.all.keys("success", "data");
                    expect(response.body.success).to.be.true;
                    expect(response.body.data).to.be.instanceof(Object);
                    expect(response.body.data).to.have.all.keys("__v", "async", "timer", "time", "playersPerTeam", "isDefault", "weekAmount", "demands", "removed", "productInfos", "defaultDeliverCost", "varegistaOwnStockAvailable", "atacadistaOwnStockAvailable", "fabricanteOwnStockAvailable", "rentStockCostByPallet", "varegistaPenaltyForUndeliveredProduct", "atacadistaPenaltyForUndeliveredProduct", "fabricantePenaltyForUndeliveredProduct", "id", "createdAt", "updatedAt", "atacadistaMultiplicador", "fabricanteMultiplicador");
                    done();
                  });
              });
        
            });

            describe('Delete', () => {
        
              it('OK', (done) => {
                chai.request(baseURL)
                  .delete(`/api/user/${entity.privileges.actions[actionIndex].methods[3]}`)
                  .set('authentication-key', loggedUser.authenticationKey)
                  .set('access-key', loggedUser.accessKey)
                  .end((error, response) => {
                    expect(response.body).to.be.instanceof(Object);
                    expect(response.body).to.have.all.keys("success", "data");
                    expect(response.body.success).to.be.true;
                    expect(response.body.data).to.be.instanceof(Object);
                    expect(response.body.data).to.have.all.keys("async", "timer", "time", "playersPerTeam", "isDefault", "weekAmount", "demands", "removed", "productInfos", "defaultDeliverCost", "varegistaOwnStockAvailable", "atacadistaOwnStockAvailable", "fabricanteOwnStockAvailable", "rentStockCostByPallet", "varegistaPenaltyForUndeliveredProduct", "atacadistaPenaltyForUndeliveredProduct", "fabricantePenaltyForUndeliveredProduct", "id", "createdAt", "updatedAt", "__v", "_id", "atacadistaMultiplicador", "fabricanteMultiplicador");
                    done();
                  });
              });

              it('AFTER: Read Setting', (done) => {
                chai.request(baseURL)
                  .get(`/api/user/${entity.privileges.actions[actionIndex].methods[2]}`)
                  .set('authentication-key', loggedUser.authenticationKey)
                  .set('access-key', loggedUser.accessKey)
                  .end((error, response) => {
                    expect(response.body).to.be.instanceof(Object);
                    expect(response.body).to.have.all.keys("success", "data");
                    expect(response.body.success).to.be.true;
                    expect(response.body.data).to.be.instanceof(Object);
                    expect(response.body.data).to.have.all.keys("id", "userSettings");
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