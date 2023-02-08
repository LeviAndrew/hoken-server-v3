import * as path from 'path';
import * as fs from "fs";

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
const baseURL = `http://localhost:${config.server.port}`;

describe('4.1.Drive', () => {

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

  describe('CRUD folders', () => {

    describe('Create', () => {

      describe('create', () => {

        describe('TEST', () => {

          let folder;

          it('create on root', (done) => {
            chai.request(baseURL)
              .post(`/api/drive/folder`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'my_folder_1'
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(folder => {
                  expect(folder).to.be.instanceOf(Object);
                  expect(folder).to.have.all.keys("removed", "owner", "name", "date", "path", "id", "createdAt", "updatedAt");
                });
                folder = response.body.data[0];
                done();
              });
          });

          it('create on root', (done) => {
            chai.request(baseURL)
              .post(`/api/drive/folder`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'my_folder_2'
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(folder => {
                  expect(folder).to.be.instanceOf(Object);
                  expect(folder).to.have.all.keys("removed", "owner", "name", "date", "path", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

          it('create on root child', (done) => {
            chai.request(baseURL)
              .post(`/api/drive/folder`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'my_folderChild_1',
                parentId: folder.id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(folder => {
                  expect(folder).to.be.instanceOf(Object);
                  expect(folder).to.have.all.keys("removed", "owner", "name", "date", "path", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

          it('create on root child again', (done) => {
            chai.request(baseURL)
              .post(`/api/drive/folder`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'Pasta Filho 2',
                parentId: folder.id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(folder => {
                  expect(folder).to.be.instanceOf(Object);
                  expect(folder).to.have.all.keys("removed", "owner", "name", "date", "path", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

          it('cant create on root child exists yet', (done) => {
            chai.request(baseURL)
              .post(`/api/drive/folder`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'my_folder_1',
                parentId: folder.id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                done();
              });
          });

          it('cant create exists yet', (done) => {
            chai.request(baseURL)
              .post(`/api/drive/folder`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'my_folder_1'
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.false;
                expect(response.body.data).to.be.instanceOf(Object);
                done();
              });
          });

        });

      });

    });

    describe('Read', () => {

      describe('Read', () => {

        describe('TEST', () => {

          let folders;

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
                  expect(file).to.have.all.keys("_id", "name", "date", "id", "owner", "extension");
                });
                folders = response.body.data.folders;
                done();
              });
          });

          it('read folder', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder?parentId=${folders[0].id}`)
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
                done();
              });
          });

        });

      });

    });

    describe('Update', () => {

      describe('rename', () => {

        let rootChildren;
        let readFolderTest;

        describe('BEFORE', () => {

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

        describe('TEST', () => {

          it('rename folder on root', (done) => {
            chai.request(baseURL)
              .put(`/api/drive/folder/rename`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                folderId: rootChildren.folders[0].id,
                newName: 'outroNome'
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "id");
                done();
              })
          });

          it('rename folder child', (done) => {
            chai.request(baseURL)
              .put(`/api/drive/folder/rename`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                folderId: readFolderTest.folders[0].id,
                newName: 'pasta filha de folder1'
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "id");
                done();
              })
          });

        });

      });

    });

    describe('Delete', () => {

      describe('remove', () => {

        let rootChildren;
        let readFolderTest;

        describe('BEFORE', () => {

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

        describe('TEST', () => {

          it('remove folder', (done) => {
            chai.request(baseURL)
              .delete(`/api/drive/folder/${rootChildren.folders[rootChildren.folders.length - 1].id}`)
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

          it('remove folder child', (done) => {
            chai.request(baseURL)
              .delete(`/api/drive/folder/${readFolderTest.folders[1].id}/?parentId=${rootChildren.folders[0].id}`)
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

  });

  describe('CRUD files', () => {

    describe('Upload', () => {

      describe('upload', () => {

        let rootChildren;
        let childrenOfChildren;

        describe('BEFORE', () => {

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
                  expect(file).to.have.all.keys("_id", "name", "date", "id", "owner", "extension");
                });
                rootChildren = response.body.data.folders;
                done();
              });
          });

          it('read folder', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder?parentId=${rootChildren[0].id}`)
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
                childrenOfChildren = response.body.data.folders;
                done();
              });
          });

        });

        describe('TEST', () => {

          it('import file .xlsx on root children', (done) => {
            const fileName = "subjects.xlsx";
            chai.request(baseURL)
              .post(`/api/drive/file/${fileName}?parentId=${rootChildren[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('driveFile', fs.readFileSync(path.resolve(`test/files/${fileName}`)), fileName)
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
              })
          });

          it('import file .jpg on folder children', (done) => {
            const fileName = "ImagemTeste.jpg";
            chai.request(baseURL)
              .post(`/api/drive/file/${fileName}?parentId=${childrenOfChildren[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('driveFile', fs.readFileSync(path.resolve(`test/files/${fileName}`)), fileName)
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
              })
          });

          it('import file .pdf on root children', (done) => {
            const fileName = "test.pdf";
            chai.request(baseURL)
              .post(`/api/drive/file/${fileName}?parentId=${rootChildren[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('driveFile', fs.readFileSync(path.resolve(`test/files/${fileName}`)), fileName)
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
              })
          });

          it('import file .pdf on root children again', (done) => {
            const fileName = "test.pdf";
            chai.request(baseURL)
              .post(`/api/drive/file/${fileName}?parentId=${rootChildren[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('driveFile', fs.readFileSync(path.resolve(`test/files/${fileName}`)), fileName)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.false;
                done();
              })
          });

          it('import file on root', (done) => {
            chai.request(baseURL)
              .post(`/api/drive/file/subjects.xlsx`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('driveFile', fs.readFileSync(path.resolve("test/files/subjects.xlsx")), 'subjects.xlsx')
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
              })
          });

          it('import file on root', (done) => {
            chai.request(baseURL)
              .post(`/api/drive/file/subjects1.xlsx`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('driveFile', fs.readFileSync(path.resolve("test/files/subjects.xlsx")), 'subjects1.xlsx')
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
              })
          });

          it('import file on root again', (done) => {
            chai.request(baseURL)
              .post(`/api/drive/file/subjects.xlsx`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .attach('driveFile', fs.readFileSync(path.resolve("test/files/subjects.xlsx")), 'subjects.xlsx')
              .end((error, response) => {
                expect(response.status).to.equal(200);
                done();
              })
          });

        });

      });

    });

    describe('Read', () => {

      describe('download', () => {

        let rootChildren;
        let childrenOfChildren;

        describe('BEFORE', () => {

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
                expect(response.body.data).to.have.all.keys("folders", "files");
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
                childrenOfChildren = response.body.data;
                done();
              });
          });

        });

        describe('TEST', () => {

          it('download file', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/file/${rootChildren.files[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.status).to.equal(200);
                done();
              })
          });

        });

      });

    });

    describe('Update', () => {

      describe('rename', () => {

        let rootChildren;
        let childrenOfChildren;

        describe('BEFORE', () => {

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
                childrenOfChildren = response.body.data;
                done();
              });
          });

        });

        describe('TEST', () => {

          it('rename file on root', (done) => {
            chai.request(baseURL)
              .put(`/api/drive/file/rename`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                fileId: rootChildren.files[0].id,
                newName: 'outroNome'
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "extension", "id");
                done();
              })
          });

          it('rename file on folder child', (done) => {
            chai.request(baseURL)
              .put(`/api/drive/file/rename`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                fileId: childrenOfChildren.files[0].id,
                newName: 'outroNome'
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Object);
                expect(response.body.data).to.have.all.keys("name", "extension", "id");
                done();
              })
          });

        });

      });

    });

    describe('Delete', () => {
    
      describe('remove', () => {
    
        let rootChildren;
        let childrenOfChildren;
    
        describe('BEFORE', () => {
    
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
                expect(response.body.data).to.have.all.keys("folders", "files");
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
                childrenOfChildren = response.body.data;
                done();
              });
          });
        });
    
        describe('TEST', () => {
    
          it('remove file', (done) => {
            chai.request(baseURL)
              .delete(`/api/drive/file/${rootChildren.files[0].id}`)
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

          it('remove file on folder child', (done) => {
            chai.request(baseURL)
              .delete(`/api/drive/file/${childrenOfChildren.files[0].id}/?parentId=${rootChildren.folders[0].id}`)
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
                expect(response.body.data).to.have.all.keys("folders", "files");
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
                childrenOfChildren = response.body.data;
                done();
              });
    
          });

        });

      });
      
    });

  });

  describe('CRUD external link', () => {

    describe('Create', () => {

      describe('create', () => {

        let rootChildren;

        describe('BEFORE', () => {

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

          let link;

          it('create on root', (done) => {
            chai.request(baseURL)
              .post(`/api/drive/link`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'Bicicleta',
                link: "https://www.americanas.com.br/categoria/esporte-e-lazer/bicicletas",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(link => {
                  expect(link).to.be.instanceOf(Object);
                  expect(link).to.have.all.keys("removed", "owner", "name", "link", "date", "path", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

          it('create other link on root', (done) => {
            chai.request(baseURL)
              .post(`/api/drive/link`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'Bola',
                link: "https://www.netshoes.com.br/bolas",
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(link => {
                  expect(link).to.be.instanceOf(Object);
                  expect(link).to.have.all.keys("removed", "owner", "name", "link", "date", "path", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

          it('create on root child', (done) => {
            chai.request(baseURL)
              .post(`/api/drive/link`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'Moto',
                link: "https://www.moto.com.br/",
                parentId: rootChildren.folders[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(link => {
                  expect(link).to.be.instanceOf(Object);
                  expect(link).to.have.all.keys("removed", "owner", "name", "link", "date", "path", "id", "createdAt", "updatedAt");
                });
                link = response.body.data[0];
                done();
              });
          });

          it('create other link in root child', (done) => {
            chai.request(baseURL)
              .post(`/api/drive/link`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                name: 'Chuteira',
                link: "https://www.netshoes.com.br/futebol/chuteiras",
                parentId: rootChildren.folders[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                expect(response.body.success).to.be.true;
                expect(response.body.data).to.be.instanceOf(Array);
                response.body.data.forEach(link => {
                  expect(link).to.be.instanceOf(Object);
                  expect(link).to.have.all.keys("removed", "owner", "name", "link", "date", "path", "id", "createdAt", "updatedAt");
                });
                done();
              });
          });

          it('read link', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/link`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                linkId: link.id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                done();
              });
          });

        });

      });

    });

    describe('Update', () => {

      describe('rename and new link', () => {

        let rootChildren, readFolderTest, link;

        describe('BEFORE', () => {

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

          it('read folder', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder?parentId=${rootChildren.folders[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                readFolderTest = response.body.data;
                done();
              });
          });

          it('read link', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/link`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                linkId: readFolderTest.externalLinks[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                link = response.body.data;
                done();
              });
          });

        });

        describe('TEST', () => {

          it('update name and link', (done) => {
            chai.request(baseURL)
              .put(`/api/drive/link`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                linkId: link.id,
                update:{
                  name: 'Carro',
                  link: 'https://www.webmotors.com.br/'
                }                
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                done();
              })
          });

        });

      });

    });

    describe('Delete', () => {

      describe('remove', () => {

        let rootChildren, readFolderTest, linkRoot, linkChildren, newRootChildren;

        describe('BEFORE', () => {

          it('read root', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                rootChildren = response.body.data;
                linkRoot = response.body.data.externalLinks[0].id;
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
                readFolderTest = response.body.data;
                done();
              });
          });

          it('read link', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/link`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .send({
                linkId: readFolderTest.externalLinks[0].id,
              })
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
                linkChildren = response.body.data;
                done();
              });
          });

        });

        describe('TEST', () => {

          it('remove link on folder children', (done) => {
            chai.request(baseURL)
              .delete(`/api/drive/link/${linkChildren.id}/?parentId=${rootChildren.folders[0].id}`)
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

          it('remove link in root', (done) => {
            chai.request(baseURL)
              .delete(`/api/drive/link/${linkRoot}`)
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
                newRootChildren = response.body.data;
                done();
              });
          });

          it('read folder', (done) => {
            chai.request(baseURL)
              .get(`/api/drive/folder?parentId=${newRootChildren.folders[0].id}`)
              .set('authentication-key', loggedUser.authenticationKey)
              .set('access-key', loggedUser.accessKey)
              .end((error, response) => {
                expect(response.body).to.be.instanceof(Object);
                expect(response.body).to.have.all.keys("success", "data");
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