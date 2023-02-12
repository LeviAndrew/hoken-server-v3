import * as path from 'path';
import * as fs from "fs";
import {TestManager} from '../TestManager';

const chai: any = require('chai'), chaiHTTP = require('chai-http'), config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect, testManager = null;
const baseURL = `http://localhost:${config.server.port}`;

describe('11.GameReport', () => {

  let loggedUser;

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

  describe("READ REPORT", () => {

    describe('TEST', () => {

      let games;

      it('read available', (done) => {
        chai.request(baseURL)
          .get("/api/user/reports-available")
          .set('authentication-key', loggedUser.authenticationKey)
          .set('access-key', loggedUser.accessKey)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Array);
            response.body.data.forEach(game => {
              expect(game).to.be.instanceof(Object);
              expect(game).to.have.all.keys("id", "createdAt");
            });
            games = response.body.data;
            done();
          })
      });

      it('read game detail', (done) => {
        chai.request(baseURL)
          .get(`/api/user/report/${games[0].id}`)
          .set('authentication-key', loggedUser.authenticationKey)
          .set('access-key', loggedUser.accessKey)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Object);
            expect(response.body.data).to.have.all.keys("gameSetting","teacher","teams","id");
            done();
          })
      });

    });

  });

  describe("DOWNLOAD REPORT", () => {

    let games;

    describe('BEFORE', () => {

      it('read available', (done) => {
        chai.request(baseURL)
          .get("/api/user/reports-available")
          .set('authentication-key', loggedUser.authenticationKey)
          .set('access-key', loggedUser.accessKey)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Array);
            response.body.data.forEach(game => {
              expect(game).to.be.instanceof(Object);
              expect(game).to.have.all.keys("id", "createdAt");
            });
            games = response.body.data;
            done();
          })
      });

    });

    describe('TEST', () => {

      it('read available', (done) => {
        chai.request(baseURL)
          .get(`/api/user/report/xlsx/${games[0].id}`)
          .set('authentication-key', loggedUser.authenticationKey)
          .set('access-key', loggedUser.accessKey)
          .buffer()
          .parse(binaryParser)
          .end((error, response) => {
            expect(response.status).to.equal(200);
            if (response.status === 200) fs.writeFileSync(path.resolve("test/files/gameReport.xlsx"), response.body);
            done();
          });
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

  });

});