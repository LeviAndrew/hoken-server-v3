import * as fs from 'fs';
import * as path from 'path';

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
const baseURL = `http://localhost:${config.server.port}`;

describe('5.1.SupportResource', () => {

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

  describe('CRUD support resource', () => {

    describe('Create', () => {

      describe('create folder', () => {

        let entity;
        let folder;
        const actionIndex = 20;

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

          it('create on root', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[2]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'Folder novo',
                folder: {
                  name: 'pasta 1',
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                  expect(resource).to.have.all.keys("visibility", "removed", "name", "entityId", "folder", "owner", "id", "createdAt", "updatedAt");
                });
                folder = response.body.data[0].folder;
                done();
              });
          });

          it('create on root child', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[7]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                folder: {
                  name: 'pasta filha do MA',
                },
                parentId: folder,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                  expect(resource).to.have.all.keys("date", "removed", "name", "path", "owner", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

        });

      });

      describe('add file on folder', () => {

        let entity, parentId, folderChildren, supportResourceId;
        const actionIndex = 20;
        let entitySupportResources;

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

          it('Read my entity support resources', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[5]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                });
                entitySupportResources = response.body.data;
                done();
              });
          });

          it('read support resources', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[21].id}/${entity.privileges.actions[21].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                });
                supportResourceId = response.body.data[0].id;
                done();
              });
          });

          it('read folder support resource', (done) => {
            chai.request(baseURL)
              .get(`/api/supportResource/${supportResourceId}/folder`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("folder", "name", "id");
                parentId = response.body.data.folder.id;
                done();
              });
          });

        });

        describe('TEST', () => {

          it('import file .xlsx on root support resource', (done) => {
            const fileName = "subjects.xlsx";
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[6]}/${fileName}/${entitySupportResources[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('localFile', fs.readFileSync(path.resolve(`test/files/${fileName}`)), fileName)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(file => {
                  expect(file).to.be.instanceOf(Object);
                  expect(file).to.have.all.keys("removed", "name", "extension", "date", "path", "owner", "size", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

          it('read folder', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder?parentId=${parentId}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data.folders).to.be.instanceOf(Array);
                response.body.data.folders.forEach(folder => {
                  expect(folder).to.be.instanceOf(Object);
                  expect(folder).to.have.all.keys("_id", "name", "date", "id");
                });
                folderChildren = response.body.data.folders[0].id;
                done();
              });
          });

          it('import file .jpg on folder children support resource', (done) => {
            const fileName = "ImagemTeste.jpg";
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[6]}/${fileName}/${entitySupportResources[0].id}?parentId=${folderChildren}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('localFile', fs.readFileSync(path.resolve(`test/files/${fileName}`)), fileName)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(file => {
                  expect(file).to.be.instanceOf(Object);
                  expect(file).to.have.all.keys("removed", "name", "extension", "date", "path", "owner", "size", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

        });

      });

      describe('link folder from drive', () => {

        let entity;
        const actionIndex = 20;
        let rootChildren;

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

          it('OK', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[4]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'Folder from drive',
                folderId: rootChildren.folders[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                  expect(resource).to.have.all.keys("visibility", "removed", "name", "entityId", "folder", "owner", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

        });

      });

      describe('link file from drive', () => {

        let entity;
        const actionIndex = 20;
        let rootChildren;

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

          it('OK', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[3]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'File from drive',
                fileId: rootChildren.files[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                  expect(resource).to.have.all.keys("visibility", "removed", "name", "entityId", "file", "owner", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

        });

      });

      describe('create external link', () => {

        let entity, link, folders, folder;
        const actionIndex = 20;

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

          it('read root', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                folders = response.body.data.folders;
                link = response.body.data.externalLinks[0];
                done();
              });
          });

          it('read folder', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder?parentId=${folders[1].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                folder = response.body.data.folders[0].id;
                done();
              });
          });

        });

        describe('TEST', () => {

          it('create link on root', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[8]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'Link novo',
                externalLink: {
                  name: 'Link do Queijo',
                  link: 'https://pt.wikipedia.org/wiki/Queijo',
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                  expect(resource).to.have.all.keys("visibility", "removed", "name", "entityId", "externalLink", "owner", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

          it('create link on folder', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[9]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                externalLink: {
                  name: 'Link do Pão',
                  link: 'https://www.tudogostoso.com.br/receita/178357-pao-caseiro.html',
                },
                parentId: folder
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                  expect(resource).to.have.all.keys("path", "removed", "name", "date", "link", "owner", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

          it('link from drive', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'Link from drive',
                linkId: link.id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                  expect(resource).to.have.all.keys("visibility", "removed", "name", "entityId", "externalLink", "owner", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

        });

      });

      describe('add file from local', () => {

        let entity;
        const actionIndex = 20;

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
            const fileName = "subjects.xlsx";
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}/${fileName}/meuprimeiromaterial`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('localFile', fs.readFileSync(path.resolve(`test/files/${fileName}`)), fileName)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                  expect(resource).to.have.all.keys("visibility", "removed", "name", "entityId", "file", "owner", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

        });

      });

    });

    describe('Read', () => {

      describe('read support resource', () => {

        let entity, folderId, supportResourceId;
        const actionIndex = 21;

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

          it('read support resources', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                });
                supportResourceId = response.body.data[0].id;
                done();
              });
          });

          it('read folder support resource', (done) => {
            chai.request(baseURL)
              .get(`/api/supportResource/${supportResourceId}/folder`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                folderId = response.body.data.folder.child.folders[0].id;
                done();
              });
          });

          it('read details child folder support resource', (done) => {
            chai.request(baseURL)
              .get(`/api/supportResource/${supportResourceId}/folder?folderId=${folderId}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("id", "child", "name");
                expect(response.body.data.child).to.be.instanceOf(Object);
                expect(response.body.data.child).to.have.all.keys("files");
                expect(response.body.data.child.files).to.be.instanceOf(Array);
                response.body.data.child.files.forEach(file => {
                  expect(file).to.be.instanceOf(Object);
                  expect(file).to.have.all.keys("_id", "name", "date", "id", "extension", "size");
                });
                done();
              });
          });

        });

      });

    });

    describe('Update', () => {

      function getResourceIdByName (name: string, resources: any[]) {
        for (let i = 0; i < resources.length; i++) {
          if(resources[i].name === name) return resources[i].id;
        }
      }

      const
        currentDate = new Date(),
        yesterday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1).getTime(),
        tomorrow = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1).getTime();

      describe('update file and folder and external link', () => {

        let entity;
        const actionIndex = 22;

        let entitySupportResources;

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

          it('Read my entity support resources', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                });
                entitySupportResources = response.body.data;
                done();
              });
          });

        });

        describe('TEST', () => {

          it('update file', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: getResourceIdByName('meuprimeiromaterial', entitySupportResources),
                update: {
                  name: "Um outro nome",
                  initDate: yesterday,
                  endDate: tomorrow,
                  visibility: false,
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("visibility", "name", "id", "endDate", "initDate");
                done();
              });
          });

          it('update folder', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: getResourceIdByName('Folder from drive', entitySupportResources),
                update: {
                  name: "MA de folder com novo nome",
                  initDate: yesterday,
                  endDate: tomorrow,
                  visibility: false,
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("visibility", "name", "id", "endDate", "initDate");
                done();
              });
          });

          it('update link', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: getResourceIdByName('Link novo', entitySupportResources),
                update: {
                  name: "Novo nome do Link",
                  initDate: yesterday,
                  endDate: tomorrow,
                  visibility: false,
                }
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("externalLink", "visibility", "name", "id", "endDate", "initDate");
                done();
              });
          });

        });

      });

    });

    describe('Delete', () => {

      describe('remove', () => {

        let rootChildren, readFolderTest, readFolderChild;
        let entityMA, entitySupportResources;

        describe('BEFORE', () => {

          it('read root', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.data).to.be.instanceof(Object);
                expect(response.body.data).to.have.all.keys("_id", "externalLinks", "files", "folders");
                rootChildren = response.body.data;
                done();
              });
          });

          it('read folder', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder?parentId=${rootChildren.folders[1].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.data).to.be.instanceof(Object);
                expect(response.body.data).to.have.all.keys("externalLinks", "files", "folders");
                readFolderTest = response.body.data;
                done();
              });
          });

          it('read folder child', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder?parentId=${readFolderTest.folders[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                readFolderChild = response.body.data;
                done();
              });
          });

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
                entityMA = response.body.data[0];
                done();
              });
          });

          it('Read my entity support resources', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entityMA.id}/${entityMA.privileges.actions[23].id}/${entityMA.privileges.actions[23].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                });
                entitySupportResources = response.body.data;
                done();
              });
          });

        });

        describe('TEST', () => {

          it('remove file on Support Resource', (done) => {
            chai.request(baseURL)
              .delete(`/api/supportResource/file/${readFolderTest.files[0].id}/?parentId=${rootChildren.folders[1].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("removed", "id");
                done();
              })
          });

          it('remove link on Support Resource', (done) => {
            chai.request(baseURL)
              .delete(`/api/supportResource/link/${readFolderChild.externalLinks[0].id}/?parentId=${readFolderTest.folders[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("removed", "id");
                done();
              })
          });

          it('remove folder child MA', (done) => {
            chai.request(baseURL)
              .delete(`/api/supportResource/folder/${readFolderChild.folders[0].id}/?parentId=${readFolderTest.folders[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("removed", "id");
                done();
              })
          });

          it('remove folder MA from Drive', (done) => {
            chai.request(baseURL)
              .delete(`/api/supportResource/folder/${readFolderTest.folders[0].id}/?parentId=${rootChildren.folders[1].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("removed", "id");
                done();
              })
          });

          it('remove MA on Drive', (done) => {
            chai.request(baseURL)
              .delete(`/api/supportResource/folder/${rootChildren.folders[1].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("removed", "id");
                done();
              })
          });

          it('remove MA', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entityMA.id}/${entityMA.privileges.actions[23].id}/${entityMA.privileges.actions[23].methods[1]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: entitySupportResources[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("removed");
                done();
              });
          });

        });

        describe('AFTER', () => {

          it('read root', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("externalLinks", "folders", "files", "_id");
                expect(response.body.data.folders).to.be.instanceOf(Array);
                response.body.data.folders.forEach(folder => {
                  expect(folder).to.be.instanceOf(Object);
                  expect(folder).to.have.all.keys("_id", "name", "date", "id");
                });
                expect(response.body.data.files).to.be.instanceOf(Array);
                response.body.data.files.forEach(file => {
                  expect(file).to.be.instanceOf(Object);
                  expect(file).to.have.all.keys("_id", "name", "date", "id", "size", "extension");
                });
                rootChildren = response.body.data;
                done();
              });
          });

          it('read folder', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder?parentId=${rootChildren.folders[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data.folders).to.be.instanceOf(Array);
                response.body.data.folders.forEach(folder => {
                  expect(folder).to.be.instanceOf(Object);
                  expect(folder).to.have.all.keys("_id", "name", "date", "id");
                });
                readFolderTest = response.body.data;
                done();
              });
          });

        });

      });

    });

    describe('Download', () => {

      describe('download file', () => {

        let entity;
        const actionIndex = 24;

        let entitySupportResources;

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

          it('Read my entity support resources', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/${entity.privileges.actions[actionIndex].methods[0]}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(resource => {
                  expect(resource).to.be.instanceOf(Object);
                });
                entitySupportResources = response.body.data;
                done();
              });
          });

        });

        describe('TEST', () => {

          it('OK', (done) => {
            chai.request(baseURL)
              .post(`/api/supportResource/${entity.id}/${entity.privileges.actions[actionIndex].id}/downloadSupportResource`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                id: entitySupportResources[0].id,
                fileId: entitySupportResources[0].folder.child.files[0].id,
              })
              .end((error, response) => {
                expect(response.status).to.equal(200);
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