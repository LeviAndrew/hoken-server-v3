import * as path from 'path';
import {mkdtemp} from "fs";

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
const expect = chai.expect, io = require('socket.io-client');
const baseURL = `http://localhost:${config.server.port}`;

describe('9.3.BeerGame_GameSyncWithTimer', () => {

  let loggedUser, clientIO, gamePin;
  const mapPlayers = new Map();

  function studentEnter(msg) {
    console.log(`aluno nick: ${msg.success.nick} => pin: ${msg.success.pin} entrou no jogo`);
  }

  describe('BEFORE', () => {
    require('./9.1.BeerGame_Config');
  })
  
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

  describe('CREATE', () => {

    describe('TEST', () => {

      it('create game', (done) => {
        chai.request(baseURL)
          .post("/api/user/game")
          .set('authentication-key', loggedUser.authenticationKey)
          .set('access-key', loggedUser.accessKey)
          .send([
            {
              name: 'group 1',
            },
            {
              name: 'group 2',
            },
          ])
          .end((error, response) => {
            gamePin = response.body.data[0].pin;
            console.log(`game pin: ${gamePin} criado`);
            done();
          });
      });

    });

  });

  describe('CONNECT', () => {

    describe('BEFORE', () => {

      it('socket connection', (done) => {
        clientIO = io(baseURL);
        clientIO.on("connect", () => {
          console.log(`Professor nome: ${loggedUser.name} conecatdo no wp`);
          done();
        });
      });

    });

    describe('TEST', () => {

      it('teacher connect game', (done) => {
        const
          response = (msg) => {
            expect(msg).to.be.instanceOf(Object);
            expect(msg).to.have.all.keys("request", "response");
            expect(msg.response).to.be.instanceOf(Object);
            expect(msg.response).to.have.all.keys("success", "data");
            expect(msg.response.success).to.be.true;
            expect(msg.response.data).to.be.true;
            console.log(`Professor conectado no jogo`);
            done();
          };
        clientIO.on("response", response);
        clientIO.on("student.enter", studentEnter);
        const
          data = {
            authenticationKey: loggedUser.authenticationKey,
          },
          toSend = {request: data};
        clientIO.emit("teacherEnter", toSend);
      });

    });

  });

  describe('STUDENTS ENTER', () => {

    const toEnter = { gameId: null, teamId: null, positionId: null };
    let playerNameCount = 1;

    function readAvailableGame() {
      return new Promise((resolve) => {
        chai.request(baseURL)
          .get("/api/open/available-game")
          .end((error, response) => {
            resolve(response.body.data[0].id);
          });
      })
    }

    function readAvailableGameTeam(gameId) {
      return new Promise(resolve => {
        chai.request(baseURL)
          .get(`/api/open/available-game/${gameId}`)
          .end((error, response) => {
            const ret = response.body.data[0] ? response.body.data[0]._id : null;
            resolve(ret);
          });
      })
    }

    function readAvailableTeamPosition(gameId, teamId) {
      return new Promise(resolve => {
        chai.request(baseURL)
          .get(`/api/open/available-game/${gameId}/${teamId}`)
          .end((error, response) => {
            const ret = response.body.data[0] ? response.body.data[0]._id : null;
            resolve(ret);
          });
      });
    }

    async function checkHasPosition() {
      const
        gameId = await readAvailableGame();
      if (!gameId) return false;
      const
        teamId = await readAvailableGameTeam(gameId);
      if (!teamId) return false;
      const
        positionId = await readAvailableTeamPosition(gameId, teamId);
      if (!positionId) return false;
      toEnter.gameId = gameId;
      toEnter.teamId = teamId;
      toEnter.positionId = positionId;
      return true;
    }

    function studentEnter() {
      return new Promise(resolve => {
        chai.request(baseURL)
          .put("/api/open/enter-game")
          .send({
            gameId: toEnter.gameId,
            teamId: toEnter.teamId,
            nick: `player ${playerNameCount}`,
            positionId: toEnter.positionId,
          })
          .end((error, response) => {
            playerNameCount++;
            mapPlayers.set(response.body.data.nick, response.body.data);
            console.log(`Player ${response.body.data.nick} entrando...`);
            resolve(null);
          });
      })
    }

    function connectStudents() {
      return new Promise(resolve => {
        for (let player of mapPlayers.values()) {
          const
            playerIO = io(baseURL);
          playerIO.on("connect", () => {
            const
              response = (msg) => {
                player.socket = playerIO;
                console.log(`Player ${player.nick} conectado com sucesso!`);
                for (let p of mapPlayers.values()) {
                  if (!p.socket) return;
                }
                resolve(null);
              };
            playerIO.on("response", response);
            let data = {
              ...player,
            };
            playerIO.emit("playerEnter", {request: data});
          });
          playerIO.connect();
        }
      })
    }

    it('enter', (done) => {
      readAvailableGame().then(async () => {
        while (await checkHasPosition()) {
          await studentEnter();
        }
        await connectStudents();
        done();
      });
    });

  });

  describe('TEACHER START GAME', () => {

    const
      onEvent = "game.status.changed",
      onEventTime = "sync.timer";

    describe('TEST', () => {

      it('students game event', (done) => {
        for (let player of mapPlayers.values()) {

          player.socket.on(onEvent, (msg) => {
            console.log(`Game ${msg.success.gameStatus} escutado pelo aluno ${player.nick}`);
          });

          player.socket.on(onEventTime, (msg) => {
            console.log(`Aluno ${player.nick} = ${msg.currentTime}`);
            // player.socket.emit('player.takeDecision', {
            //   request: {
            //     playerId: player.playerId,
            //     decision: 10
            //   }
            // });
          });

          player.socket.on("decision.received", (msg) => {
            console.log(`Decisão aluno ${player.nick} = ${msg.success}`);
          });

          player.socket.on("player.nextWeek", (msg) => {
            player.playedArray[player.playedArray - 1] = msg[0];
            player.playedArray.push(msg[1]);
            console.log(`Próxima semana aluno ${player.nick} = ${JSON.stringify(msg[1])}`);
          });

          player.socket.on("player.endGame", (msg) => {
            player.playedArray[player.playedArray - 1] = msg[0];
            console.log(`Jogo finalizado para o aluno ${player.nick} = ${JSON.stringify(msg)}`);
          });
        }
        done();
      });

      it('teacher events', (done) => {

        clientIO.on(onEvent, (msg) => {
          console.log(`Game ${msg.response.success.gameStatus} escutado pelo professor`);
        });

        clientIO.on(onEventTime, (msg) => {
          console.log(`Professor currentTime => ${msg.currentTime}`);
        });

        clientIO.on('game.finished', (msg) => {
          console.log(`Jogo do professor finalizado => ${JSON.stringify(msg)}`);
          clientIO.removeAllListeners();
          done();
        });

        let data = {
          status: 'started',
        };
        clientIO.emit("game.status.change", {request: data});
      });

    });

  });

  describe('TEACHER TRY RESTART A GAME', () => {

    const
      onEvent = "game.status.changed";

    describe('TEST', () => {

      it('teacher events', (done) => {

        clientIO.on(onEvent, (msg) => {
          console.log(`Game error: ${msg.response.error} escutado pelo professor`);
          done();
        });

        let data = {
          status: 'started',
        };
        clientIO.emit("game.status.change", {request: data});

      });

    });

  });

});