import * as path from 'path';
import {TestManager} from '../TestManager';
import { cpf } from 'cpf-cnpj-validator'; 

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
let testManager = null;
const baseURL = `http://localhost:${config.server.port}`;

describe('1.Open', () => {

  let loggedUser;

  before((done) => {
    testManager = new TestManager(done);
  });

  describe('LOGIN', () => {

    describe('TEST', () => {

      // it('response invalid password', (done) => {
      //   chai.request(baseURL)
      //     .post("/api/login/hoken")
      //     .send({
      //       login: 'admin@admin.com',
      //       password: 'admin1231'
      //     })
      //     .end((error, response) => {
      //       expect(response.body).to.be.instanceof(Object);
      //       expect(response.body).to.have.all.keys("success", "data");
      //       expect(response.body.success).to.be.false;
      //       expect(response.body.data).to.be.instanceof(Object);
      //       expect(response.body.data).to.have.all.keys("title","description","buttons","type");
      //       expect(response.body.data.buttons).to.be.instanceOf(Array);
      //       response.body.data.buttons.forEach(button=>{
      //         expect(button).to.be.instanceOf(Object);
      //         expect(button).to.have.all.keys("label","method");
      //       });
      //       done();
      //     })
      // });

      // it('cpf error ldap', (done) => {
      //   const cpfTest = cpf.generate();
      //   chai.request(baseURL)
      //     .post("/api/login/hoken")
      //     .send({
      //       login: cpfTest,
      //       password: 'admin1231'
      //     })
      //     .end((error, response) => {
      //       expect(response.body).to.be.instanceof(Object);
      //       expect(response.body).to.have.all.keys("success", "data");
      //       expect(response.body.success).to.be.false;
      //       expect(response.body.data).to.be.instanceof(Object);
      //       expect(response.body.data).to.have.all.keys("title","description","buttons","type");
      //       expect(response.body.data.buttons).to.be.instanceOf(Array);
      //       response.body.data.buttons.forEach(button=>{
      //         expect(button).to.be.instanceOf(Object);
      //         expect(button).to.have.all.keys("label","method");
      //       });
      //       done();
      //     })
      // });

      it('Login polvo levi teste sucesso', (done) => {
        chai.request(baseURL)
          .post("/api/login/hoken")
          .send({
            login: 'levi@admin.com',
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

      // it('Login levi teste sucesso LDAP', (done) => { // precisa estar conectado a VPN da UDESC
      //   chai.request(baseURL)
      //     .post("/api/login/hoken")
      //     .send({
      //       login: '01097820386',
      //       password: 'romaLama98'
      //     })
      //     .end((error, response) => {
      //       expect(response.body).to.be.instanceof(Object);
      //       expect(response.body).to.have.all.keys("success", "data");
      //       expect(response.body.success).to.be.true;
      //       expect(response.body.data).to.be.instanceof(Object);
      //       expect(response.body.data).to.have.all.keys("_id", "name", "surname", "birthday", "email", "matriculation", "document", "id", "accessKey", "authenticationKey", "drive");
      //       expect(response.body.data.document).to.be.instanceOf(Object);
      //       expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
      //       loggedUser = response.body.data;
      //       done();
      //     })
      // });

      // it('Login LDAP levi error', (done) => {
      //   chai.request(baseURL)
      //     .post("/api/login/hoken")
      //     .send({
      //       login: '01097820386',
      //       password: 'admin123'
      //     })
      //     .end((error, response) => {
      //       expect(response.body).to.be.instanceof(Object);
      //       expect(response.body).to.have.all.keys("success", "data");
      //       expect(response.body.success).to.be.true;
      //       expect(response.body.data).to.be.instanceof(Object);
      //       expect(response.body.data).to.have.all.keys("_id", "name", "surname", "birthday", "email", "matriculation", "document", "id", "accessKey", "authenticationKey", "drive");
      //       expect(response.body.data.document).to.be.instanceOf(Object);
      //       expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
      //       loggedUser = response.body.data;
      //       done();
      //     })
      // });

      // it('Login polvo levi error', (done) => { // ERRO AQUI -- OpenHandler.ts: linha 129 : res.on('searchEntry', entry => {
      //   chai.request(baseURL)
      //     .post("/api/login/hoken")
      //     .send({
      //       login: 'levi@admin.com',
      //       password: 'teste98'
      //     })
      //     .end((error, response) => {
      //       expect(response.body).to.be.instanceof(Object);
      //       expect(response.body).to.have.all.keys("success", "data");
      //       expect(response.body.success).to.be.true;
      //       expect(response.body.data).to.be.instanceof(Object);
      //       expect(response.body.data).to.have.all.keys("_id", "name", "surname", "birthday", "email", "matriculation", "document", "id", "accessKey", "authenticationKey", "drive");
      //       expect(response.body.data.document).to.be.instanceOf(Object);
      //       expect(response.body.data.document).to.have.all.keys("_id", "documentType", "documentNumber");
      //       loggedUser = response.body.data;
      //       done();
      //     })
      // });

      it('Login com email', (done) => {
        chai.request(baseURL)
          .post("/api/login/hoken")
          .send({
            login: 'admin@admin.com', //'admin@admin.com', 06111052926
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

      it('Login com CPF', (done) => {
        chai.request(baseURL)
          .post("/api/login/hoken")
          .send({
            login: '06111052926',
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

      it('Login com matricula', (done) => {
        chai.request(baseURL)
          .post("/api/login/hoken")
          .send({
            login: '123456789',
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

  describe("LOGOUT", () => {

    describe('TEST', () => {

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

    describe('AFTER', () => {

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