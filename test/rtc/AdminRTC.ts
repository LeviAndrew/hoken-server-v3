import * as path from 'path';
import {TestManager} from '../TestManager';

const config = require(path.resolve('devConfig.json'));

const chai = require("chai");
const chaihttp = require("chai-http");
chai.use(chaihttp);
let expect = chai.expect;
let io = require("socket.io-client");
let socketUrl = `http://localhost:${config.server.port}`;
let testManager = null;

describe("Test AdminRTC", () => {
  before((done) => {
    testManager = new TestManager(done);
  });

  let client = null;
  let userAdmin = null;

  it("CONNECT", (done) => {
    client = io(socketUrl);
    client.on("connect", (data) => {
      done();
    });
    client.connect();
  });

  describe('LOGIN', () => {

    describe('Success', () => {

      it("Admin", (done) => {
        let response = (msg) => {
          expect(msg).to.be.instanceof(Object);
          expect(msg).to.have.all.keys("request", "response");
          expect(msg.response).to.be.instanceof(Object);
          expect(msg.response).to.have.all.keys("success", "data");
          expect(msg.response.success).to.be.true;
          expect(msg.response.data).to.be.instanceof(Object);
          expect(msg.response.data).to.have.all.keys("name", "surname", "email", "id", "type");
          userAdmin = msg.response.data;
          client.removeListener("response", response);
          done();
        };
        client.on("response", response);
        let data = {
          login: "admin@admin.com",
          password: "admin",
        };
        client.emit("login", {request: data});
      });

    });

  });

  describe('LOGOUT', () => {

    describe('Success logout', () => {

      it("Admin Logout", (done) => {
        let response = (msg) => {
          expect(msg).to.be.instanceof(Object);
          expect(msg).to.have.all.keys("request", "response");
          expect(msg.response).to.be.instanceof(Object);
          expect(msg.response).to.have.all.keys("success", "data");
          expect(msg.response.success).to.be.true;
          expect(msg.response.data).to.be.instanceof(Object);
          expect(msg.response.data).to.have.all.keys("_id", "type", "logged");
          userAdmin = null;
          client.removeListener("response", response);
          done();
        };
        client.on("response", response);
        let data = null;
        client.emit("logout", {request: data});
      });

    });

  });

});