import * as fs from 'fs';
import * as path from 'path';

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
const baseURL = `http://localhost:${config.server.port}`;

describe('3.Management - Users', () => {

  let loggedUser;

  describe("before", () => {
    require('./3.2.ManagementeAPI_entity');
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

  describe('CRUD user', () => {

    describe('Create', () => {

      describe('create', () => {

        let entity;
        let entities;
        let privileges;
        const actionIndex = 10;

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

          it('Read entity by name', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: "filha",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(entity => {
                  expect(entity).to.be.instanceOf(Object);
                });
                entities = response.body.data;
                done();
              })
          });

          it('Read privileges', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
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
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'Levi',
                surname: 'O Mestre do Back',
                birthday: new Date(1998, 3, 15).getTime(),
                email: "teste@teste.com",
                password: '123456',
                matriculation: '987654321',
                document: {
                  documentType: 'CPF',
                  documentNumber: '06111052938',
                },
                entities: [
                  {
                    entity: entities[0].id,
                    privileges: privileges[privileges.length - 1].id,
                  },
                  {
                    entity: entities[1].id,
                    privileges: privileges[privileges.length - 1].id,
                  },
                  {
                    entity: entities[2].id,
                    privileges: privileges[privileges.length - 1].id,
                  },
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

      });

      describe('import users', () => {

        let entity;
        let privileges;
        const actionIndex = 16;

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

          it('read all privileges', (done) => {
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

          // it('import students', (done) => {
          //   chai.request(baseURL)
          //     .post(`/api/upload/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}/${privileges[1].id}`)
          //     .set('authentication-key', loggedUser.authenticationKey)
          //     .set('access-key', loggedUser.accessKey)
          //     .attach('userDocument', fs.readFileSync(path.resolve("test/files/student.xlsx")), 'student.xlsx"')
          //     .end((error, response) => {
          //       expect(response.body).to.be.instanceof(Object);
          //       expect(response.body).to.have.all.keys("success", "data");
          //       expect(response.body.success).to.be.true;
          //       expect(response.body.data).to.be.true;
          //       done();
          //     })
          // });

          // it('import students', (done) => {
          //   chai.request(baseURL)
          //     .post(`/api/upload/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}/${privileges[1].id}`)
          //     .set('authentication-key', loggedUser.authenticationKey)
          //     .set('access-key', loggedUser.accessKey)
          //     .attach('userDocument', fs.readFileSync(path.resolve("test/files/student_2.xlsx")), 'student_2.xlsx"')
          //     .end((error, response) => {
          //       expect(response.body).to.be.instanceof(Object);
          //       expect(response.body).to.have.all.keys("success", "data");
          //       expect(response.body.success).to.be.true;
          //       expect(response.body.data).to.be.true;
          //       done();
          //     })
          // });

          // it('import teachers', (done) => {
          //   chai.request(baseURL)
          //     .post(`/api/upload/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}/${privileges[0].id}`)
          //     .set('authentication-key', loggedUser.authenticationKey)
          //     .set('access-key', loggedUser.accessKey)
          //     .attach('userDocument', fs.readFileSync(path.resolve("test/files/teacher.xlsx")), 'teacher.xlsx"')
          //     .end((error, response) => {
          //       expect(response.body).to.be.instanceof(Object);
          //       expect(response.body).to.have.all.keys("success", "data");
          //       expect(response.body.success).to.be.true;
          //       expect(response.body.data).to.be.true;
          //       done();
          //     })
          // });

          // it('import teachers 1', (done) => {
          //   chai.request(baseURL)
          //     .post(`/api/upload/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}/${privileges[0].id}`)
          //     .set('authentication-key', loggedUser.authenticationKey)
          //     .set('access-key', loggedUser.accessKey)
          //     .attach('userDocument', fs.readFileSync(path.resolve("test/files/teacher.xlsx")), 'teacher.xlsx"')
          //     .end((error, response) => {
          //       expect(response.body).to.be.instanceof(Object);
          //       expect(response.body).to.have.all.keys("success", "data");
          //       expect(response.body.success).to.be.true;
          //       expect(response.body.data).to.be.true;
          //       done();
          //     })
          // });

        });

      });

    });

    describe('Read', () => {

      describe('read by page', () => {

        let entity;
        const actionIndex = 11;

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
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
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
                response.body.data.users.forEach(user => {
                  expect(user).to.be.instanceOf(Object);
                  if (user.birthday) expect(user).to.have.all.keys("name", "surname", "birthday", "email", "matriculation", "document", "id", "entities");
                  else expect(user).to.have.all.keys("name", "surname", "email", "matriculation", "document", "id", "entities");
                  expect(user.document).to.be.instanceOf(Object);
                  expect(user.document).to.have.all.keys("_id", "documentType", "documentNumber");
                });
                done();
              })
          });

        });

      });

      describe('read by filter', () => {

        let entity;
        const actionIndex = 11;

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

          it('by name', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                filterType: 'name',
                data: "Admin",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(user => {
                  expect(user).to.be.instanceOf(Object);
                  expect(user).to.have.all.keys("name", "surname", "birthday", "email", "entities", "matriculation", "document", "id");
                  expect(user.document).to.be.instanceOf(Object);
                  expect(user.document).to.have.all.keys("_id", "documentType", "documentNumber");
                  expect(user.entities).to.be.instanceOf(Array);
                  user.entities.forEach(ent => {
                    expect(ent).to.be.instanceOf(Object);
                    expect(ent).to.have.all.keys("date", "entity", "privileges");
                  });
                });
                done();
              })
          });

          it('by documentNumber', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                filterType: 'document',
                data: "06111052926",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(user => {
                  expect(user).to.be.instanceOf(Object);
                  expect(user).to.have.all.keys("name", "surname", "birthday", "email", "entities", "matriculation", "document", "id");
                  expect(user.document).to.be.instanceOf(Object);
                  expect(user.document).to.have.all.keys("_id", "documentType", "documentNumber");
                  expect(user.entities).to.be.instanceOf(Array);
                  user.entities.forEach(ent => {
                    expect(ent).to.be.instanceOf(Object);
                    expect(ent).to.have.all.keys("date", "entity", "privileges");
                  });
                });
                done();
              })
          });

          it('by matriculation', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                filterType: 'matriculation',
                data: "123456789",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(user => {
                  expect(user).to.be.instanceOf(Object);
                  expect(user).to.have.all.keys("name", "surname", "birthday", "email", "entities", "matriculation", "document", "id");
                  expect(user.document).to.be.instanceOf(Object);
                  expect(user.document).to.have.all.keys("_id", "documentType", "documentNumber");
                  expect(user.entities).to.be.instanceOf(Array);
                  user.entities.forEach(ent => {
                    expect(ent).to.be.instanceOf(Object);
                    expect(ent).to.have.all.keys("date", "entity", "privileges");
                  });
                });
                done();
              })
          });

        });

      });

      describe('read user entities', () => {

        let entity;
        let user;
        const actionIndex = 11;

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

          it('read user by name', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                filterType: 'name',
                data: "Levi",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(user => {
                  expect(user).to.be.instanceOf(Object);
                  expect(user).to.have.all.keys("entities", "name", "surname", "birthday", "email", "matriculation", "document", "id");
                  expect(user.document).to.be.instanceOf(Object);
                  expect(user.document).to.have.all.keys("_id", "documentType", "documentNumber");
                });
                user = response.body.data[0];
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
                id: "59d418c0659c0ab8386f19e3",
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
                done();
              })
          });

        });

      });

      describe('read all user', () => {

        let entity;
        const actionIndex = 11;

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
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[3]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                done();
              })
          });

        });

      });

    });

    describe('Update', () => {

      describe('update', () => {

        let entity;
        let user;
        const actionIndex = 12;

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

          it('read user by name', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                filterType: 'name',
                data: "Levi",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                user = response.body.data;
                done();
              })
          });

        });

        describe('TEST', () => {

          it('name', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: user[0].id,
                update: {
                  name: "Novo Nome"
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "surname", "birthday", "email", "matriculation", "document", "_id");
                expect(response.body.data.document).to.be.instanceOf(Object);
                expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
                user = response.body.data;
                done();
              })
          });

          it('surname', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: user._id,
                update: {
                  surname: "Novo Sobrenome"
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "surname", "birthday", "email", "matriculation", "document", "_id");
                expect(response.body.data.document).to.be.instanceOf(Object);
                expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
                user = response.body.data;
                done();
              })
          });

          it('birthday', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: user._id,
                update: {
                  birthday: new Date(1990, 6, 20).getTime(),
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "surname", "birthday", "email", "matriculation", "document", "_id");
                expect(response.body.data.document).to.be.instanceOf(Object);
                expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
                user = response.body.data;
                done();
              })
          });

          it('email password matriculation', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: user._id,
                update: {
                  email: "novo@email.com",
                  password: '456789',
                  matriculation: "121212121212121",
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "surname", "birthday", "email", "matriculation", "document", "_id");
                expect(response.body.data.document).to.be.instanceOf(Object);
                expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
                user = response.body.data;
                done();
              })
          });

          it('document', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: user._id,
                update: {
                  document: {
                    documentType: "RG",
                    documentNumber: "20202020220020",
                  }
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "surname", "birthday", "email", "matriculation", "document", "_id");
                expect(response.body.data.document).to.be.instanceOf(Object);
                expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
                user = response.body.data;
                done();
              })
          });

        });

      });

      describe('add on entity', () => {

        let entity;
        let user;
        let entities;
        let privileges;
        const actionIndex = 13;

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

          it('read entity by name', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: "filha vis",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                entities = response.body.data;
                done();
              })
          });

          it('read privileges', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[4]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                privileges = response.body.data;
                done();
              })
          });

          it('read user by name', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                filterType: 'name',
                data: "Novo Nome",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                user = response.body.data;
                done();
              })
          });

        });

        describe('TEST', () => {

          it('OK', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[5]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: user[0].id,
                to: entity.children[3],
                privileges: privileges[0].id
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "surname", "birthday", "email", "matriculation", "document", "_id", "entities");
                expect(response.body.data.entities).to.be.instanceOf(Array);
                expect(response.body.data.document).to.be.instanceOf(Object);
                expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
                done();
              })
          });

        });

      });

      describe('remove from entity', () => {

        let entity;
        let users;
        let user;
        const actionIndex = 14;

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

          it('read user by name', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                filterType: 'name',
                data: "Novo Nome",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(user => {
                  expect(user).to.be.instanceOf(Object);
                  expect(user).to.have.all.keys("name", "surname", "birthday", "email", "entities", "matriculation", "document", "id");
                  expect(user.document).to.be.instanceOf(Object);
                  expect(user.document).to.have.all.keys("_id", "documentType", "documentNumber");
                  expect(user.entities).to.be.instanceOf(Array);
                  user.entities.forEach(ent => {
                    expect(ent).to.be.instanceOf(Object);
                    expect(ent).to.have.all.keys("date", "entity", "privileges");
                  });
                });
                users = response.body.data[0];
                done();
              })
          });

          it('read user entities', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: users.id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("entities", "id");
                expect(response.body.data.entities).to.be.instanceOf(Array);
                user = response.body.data;
                done();
              })
          });

        });

        describe('TEST', () => {

          it('OK', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[3]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: user.id,
                from: user.entities[0].entity.id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "surname", "birthday", "email", "matriculation", "document", "_id", "entities");
                expect(response.body.data.entities).to.be.instanceOf(Array);
                expect(response.body.data.document).to.be.instanceOf(Object);
                expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
                done();
              })
          });

        });

      });

      describe('change privilege', () => {

        let entity;
        let users;
        let user;
        let privileges;
        const actionIndex = 15;

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

          it('read user by name', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                filterType: 'name',
                data: "Novo Nome",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(user => {
                  expect(user).to.be.instanceOf(Object);
                  expect(user).to.have.all.keys("name", "surname", "birthday", "email", "entities", "matriculation", "document", "id");
                  expect(user.document).to.be.instanceOf(Object);
                  expect(user.document).to.have.all.keys("_id", "documentType", "documentNumber");
                  expect(user.entities).to.be.instanceOf(Array);
                  user.entities.forEach(ent => {
                    expect(ent).to.be.instanceOf(Object);
                    expect(ent).to.have.all.keys("date", "entity", "privileges");
                  });
                });
                users = response.body.data[0];
                done();
              })
          });

          it('read user entities', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: users.id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("entities", "id");
                expect(response.body.data.entities).to.be.instanceOf(Array);
                user = response.body.data;
                done();
              })
          });

          it('read privileges', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[3]}`)
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
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[4]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: user.id,
                entity: user.entities[0].entity.id,
                privilege: privileges[0].id,
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
                done();
              });
          });

        });

      });

    });

    describe('Remove', () => {

      describe('remove', () => {

        let entity;
        let user, user2;
        const actionIndex = 17;

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

          it('read user by name', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                filterType: 'name',
                data: "Novo Nome",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                user = response.body.data[0];
                done();
              })
          });

          it('other read user by name', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                filterType: 'name',
                data: "Levi",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                user2 = response.body.data[0];
                done();
              })
          });

        });

        describe('TEST', () => {

          it('OK', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                usersId: [user.id, user2.id],
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(user => {
                  expect(user).to.be.instanceof(Object);
                  expect(user).to.have.all.keys("id", "removed", "name");
                  expect(user.removed).to.be.true;
                });                
                done();
              })
          });
          
          it('AFTER', (done) => {
            chai.request(baseURL)
              .post(`/api/management/${entity.id}/${entity.privileges.actions[11].id}/${entity.privileges.actions[11].methods[3]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
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