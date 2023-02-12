import * as path from 'path';

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
let expect = chai.expect;
const baseURL = `http://localhost:${config.server.port}`;

describe('9.8.BeerGame_PlatformGame', () => {

  let user;

  describe('BEFORE', () => {
    require('./9.1.BeerGame_Config');
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
          user = response.body.data;
          done();
        })
    });

  });

  describe('CREATE GAME', () => {

    describe('TEST', () => {

      it('create game api key', (done) => {
        chai.request(baseURL)
          .post("/api/platform/game")
          .set('platform-key', "5fa93fc258821729e4d47ad7")
          .set('user-id', user.id)
          .send({
            teams: [
              {
                name: 'group 1',
                players: [
                  {
                    nick: "varegista",
                    playerType: 'varegista',
                  },
                  {
                    nick: "atacadista",
                    playerType: 'atacadista',
                  },
                  {
                    nick: "distribuidor",
                    playerType: 'distribuidor',
                  },
                  {
                    nick: "industria",
                    playerType: 'industria',
                  },
                ],
              },
              {
                name: 'group 2',
                players: [
                  {
                    nick: "varegista",
                    playerType: 'varegista',
                  },
                  {
                    nick: "atacadista",
                    playerType: 'atacadista',
                  },
                  {
                    nick: "distribuidor",
                    playerType: 'distribuidor',
                  },
                  {
                    nick: "industria",
                    playerType: 'industria',
                  },
                ],
              },
            ]
          })
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Object);
            expect(response.body.data).to.have.all.keys("gameStatus", "removed", "gameSetting", "teacher", "teams", "pin", "id", "createdAt", "updatedAt", "authenticationKey", "accessKey");
            console.log(`?accessKey=${response.body.data.accessKey}&authenticationKey=${response.body.data.authenticationKey}`);
            done();
          });
      });

    });

  });

});