import * as path from 'path';

const chai: any = require('chai');
const chaiHTTP = require('chai-http');
const config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
const expect = chai.expect,
  io = require('socket.io-client');
const baseURL = `http://localhost:${config.server.port}`;

describe('9.2.BeerGame_Game', () => {

  let loggedUser, clientIO, gamePin, playerPin;

  function studentEnter(msg) {
    if (msg.success.nick === "player 1") playerPin = msg.success.pin;
    console.log(`nick: ${msg.success.nick} => pin: ${msg.success.pin}`);
  }

  function onGameStatusChange(msg) {
    console.log(`response => ${JSON.stringify(msg.response)}`);
  }

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
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Array);
            response.body.data.forEach(game => {
              expect(game).to.be.instanceOf(Object);
              expect(game).to.have.all.keys("gameStatus", "removed", "gameSetting", "teacher", "teams", "pin", "id", "createdAt", "updatedAt");
            });
            gamePin = response.body.data[0].pin;
            done();
          });
      });

      it('try create another game (userAlreadyHaveAGame)', (done) => {
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
            {
              name: 'group 3',
            },
            {
              name: 'group 4',
            },
          ])
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.false;
            done();
          });
      });

    });

  });

  describe('CONNECT', () => {

    describe('BEFORE', () => {

      it('OK', (done) => {
        clientIO = io(baseURL);
        clientIO.on("connect", (data) => {
          done();
        });
      });

    });

    describe('TEST', () => {

      it('OK', (done) => {
        const
          response = (msg) => {
            expect(msg).to.be.instanceOf(Object);
            expect(msg).to.have.all.keys("request", "response");
            expect(msg.response).to.be.instanceOf(Object);
            expect(msg.response).to.have.all.keys("success", "data");
            expect(msg.response.success).to.be.true;
            expect(msg.response.data).to.be.true;
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

  // describe('TEACHER TRY START GAME', () => {
  //
  //   const
  //     onEvent = "game.status.changed";
  //
  //   describe('TEST', () => {
  //
  //     it('OK', (done) => {
  //       const
  //         response = (msg) => {
  //           expect(msg).to.be.instanceOf(Object);
  //           expect(msg).to.have.all.keys("request", "response");
  //           expect(msg.response).to.be.instanceOf(Object);
  //           expect(msg.response).to.have.all.keys("error");
  //           done();
  //         };
  //       clientIO.on(onEvent, response);
  //       let data = {
  //         status: 'started',
  //       };
  //       clientIO.emit("game.status.change", {request: data});
  //     });
  //
  //   });
  //
  // });

  describe('READ AVAILABLE GAME', () => {

    describe('TEST', () => {

      let game, team;

      it('read game', (done) => {
        chai.request(baseURL)
          .get("/api/open/available-game")
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Array);
            response.body.data.forEach(game => {
              expect(game).to.be.instanceOf(Object);
              expect(game).to.have.all.keys("createdAt", "gameSetting", "teacher", "teams", "id");
            });
            game = response.body.data[0];
            done();
          });
      });

      it('read team', (done) => {
        chai.request(baseURL)
          .get(`/api/open/available-game/${game.id}`)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Array);
            response.body.data.forEach(team => {
              expect(team).to.be.instanceof(Object);
              expect(team).to.have.all.keys("_id", "nick", "players");
            });
            team = response.body.data[0];
            done();
          });
      });

      it('read position', (done) => {
        chai.request(baseURL)
          .get(`/api/open/available-game/${game.id}/${team._id}`)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Array);
            response.body.data.forEach(player => {
              expect(player).to.be.instanceof(Object);
              expect(player).to.have.all.keys("_id","playerType","playedArray");
            });
            done();
          });
      });

    });

  });

  let player, playerIO, playersMap = new Map();

  describe('STUDENT ENTER', () => {

    let
      game;

    describe('BEFORE', () => {

      it('read available game', (done) => {
        chai.request(baseURL)
          .get("/api/open/available-game")
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Array);
            game = response.body.data;
            done();
          });
      });

    });

    describe('TEST', () => {

      it('ok', (done) => {
        chai.request(baseURL)
          .put("/api/open/enter-game")
          .send({
            gameId: game[0].id,
            teamId: game[0].teams[0]._id,
            nick: 'player 1',
            positionId: game[0].teams[0].players[0]._id,
          })
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            player = response.body.data;
            done();
          });
      });

    });

  });

  describe('CONNECT PLAYER', () => {

    describe('BEFORE', () => {

      it('OK', (done) => {
        playerIO = io(baseURL);
        playerIO.on("connect", (data) => {
          done();
        });
        playerIO.connect();
      });

    });

    describe('TEST', () => {

      it('OK', (done) => {
        const
          response = (msg) => {
            expect(msg).to.be.instanceOf(Object);
            expect(msg).to.have.all.keys("request", "response");
            expect(msg.response).to.be.instanceOf(Object);
            expect(msg.response).to.have.all.keys("success", "data");
            expect(msg.response.success).to.be.true;
            expect(msg.response.data).to.be.true;
            playerIO.on("decision.received", (msg) => {
              done();
            })
            playerIO.emit("player.takeDecision", {request: data});
          };
        playerIO.on("response", response);
        let data = {
          ...player
        };
        playerIO.emit("playerEnter", {request: data});
      });

    });

  });

  describe('STUDENTS ENTER', () => {

    let game, playerCount = 1;

    function checkHasVacancy() {
      game = null;
      return new Promise(resolve => {
        chai.request(baseURL)
          .get("/api/open/available-game")
          .end((error, response) => {
            for (let i = 0; i < response.body.data[0].teams.length; i++) {
              if (response.body.data[0].teams[i].players.length > 0) {
                playerCount++;
                game = {
                  gameId: response.body.data[0].id,
                  teamId: response.body.data[0].teams[i]._id,
                  nick: `player ${playerCount}`,
                  positionId: response.body.data[0].teams[i].players[0]._id,
                };
                break;
              }
            }
            resolve(null);
          });
      })
    }

    function studentEnter() {
      return new Promise(resolve => {
        chai.request(baseURL)
          .put("/api/open/enter-game")
          .send(game)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            playersMap.set(response.body.data.nick, response.body.data);
            const player = playersMap.get(response.body.data.nick);
            player['socket'] = io(baseURL);
            player.socket.on('connect', () => {
              player.socket.on("response", (msg) => {
                resolve(null);
              });
              let data = {
                playerId: player.playerId,
                gameId: player.gameId,
                teamId: player.teamId,
                nick: player.nick,
                teacher: player.teacher,
                positionId: player.positionId,
              };
              player.socket.emit("playerEnter", {request: data});
            });
            player.socket.connect();
          });
      })
    }

    it('enter', (done) => {
      checkHasVacancy().then(async () => {
        while (!!game) {
          await studentEnter();
          await checkHasVacancy();
        }
        done();
      });
    });

  });

  describe('TEACHER START GAME', () => {

    const onEvent = "game.status.changed";

    describe('BEFORE', () => {

      it('wiring students game change status', (done) => {
        const changeEvent = (msg) => {
            console.log(onEvent, msg);
          };
        playerIO.on(onEvent, changeEvent);
        for (let player of playersMap.values()) {
          player.socket.on(onEvent, changeEvent);
        }
        done();
      });

    });

    describe('TEST', () => {

      it('OK', (done) => {
        const
          response = (msg) => {
            expect(msg).to.be.instanceOf(Object);
            expect(msg).to.have.all.keys("request", "response");
            expect(msg.response).to.be.instanceOf(Object);
            expect(msg.response).to.have.all.keys("success");
            expect(msg.response.success).to.be.instanceOf(Object);
            // expect(msg.response.success).to.have.all.keys("gameStatus", "id");
            done();
          };
        clientIO.on(onEvent, response);
        let data = {
          status: 'started',
        };
        clientIO.emit("game.status.change", {request: data});
      });

    });

  });

  describe('TEACHER DISCONNECT', () => {

    const onEvent = "teacher.disconnect";

    describe('BEFORE', () => {

      it('wiring students teacher disconnect', (done) => {
        const
          changeEvent = (msg) => {
            console.log(onEvent, msg);
          };
        playerIO.on(onEvent, changeEvent);
        for (let player of playersMap.values()) {
          player.socket.on(onEvent, changeEvent);
        }
        done();
      });

    });

    describe('TEST', () => {

      it('disconnect', (done) => {
        clientIO.disconnect();
        done();
      });

    });

  });

  describe('READ GAME', () => {

    describe('TEST', () => {

      it('read game', (done) => {
        chai.request(baseURL)
          .get("/api/user/game")
          .set('authentication-key', loggedUser.authenticationKey)
          .set('access-key', loggedUser.accessKey)
          .end((error, response) => {
            expect(response.body).to.be.instanceof(Object);
            expect(response.body).to.have.all.keys("success", "data");
            expect(response.body.success).to.be.true;
            expect(response.body.data).to.be.instanceof(Object);
            expect(response.body.data).to.have.all.keys("gameStatus", "gameSetting", "teams", "id");
            done();
          });
      });

    });

  });

  describe('RECONNECT TEACHER', () => {

    describe('BEFORE', () => {

      it('OK', (done) => {
        clientIO = io(baseURL);
        clientIO.on("connect", (data) => {
          done();
        });
      });

    });

    describe('TEST', () => {

      it('OK', (done) => {
        const
          response = (msg) => {
            expect(msg).to.be.instanceOf(Object);
            expect(msg).to.have.all.keys("request", "response");
            expect(msg.response).to.be.instanceOf(Object);
            expect(msg.response).to.have.all.keys("success", "data");
            expect(msg.response.success).to.be.true;
            expect(msg.response.data).to.be.true;
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

  describe('TEACHER RESTART GAME', () => {

    const onEvent = "game.status.changed";

    describe('TEST', () => {

      it('OK', (done) => {
        let alreadyCalled = false;
        const
          response = (msg) => {
            onGameStatusChange(msg);
            if (alreadyCalled) return;
            expect(msg).to.be.instanceOf(Object);
            expect(msg).to.have.all.keys("request", "response");
            expect(msg.response).to.be.instanceOf(Object);
            expect(msg.response).to.have.all.keys("success");
            expect(msg.response.success).to.be.instanceOf(Object);
            expect(msg.response.success).to.have.all.keys("gameStatus", "id");
            alreadyCalled = true;
            done();
          };
        clientIO.on(onEvent, response);
        let data = {
          status: 'started',
        };
        clientIO.emit("game.status.change", {request: data});
      });

    });

  });

  describe('STUDENT DISCONNECT', () => {

    const onEvent = "student.disconnect";

    describe('BEFORE', () => {

      it('wiring teacher - student disconnected', (done) => {
        const
          changeEvent = (msg) => {
            console.log(onEvent, msg);
          };
        clientIO.on(onEvent, changeEvent);
        done();
      });

    });

    describe('TEST', () => {

      it('disconnect', (done) => {
        playerIO.disconnect();
        done();
      });

    });

  });

  describe('RECONNECT PLAYER', () => {

    describe('BEFORE', () => {

      it('OK', (done) => {
        playerIO = io(baseURL);
        playerIO.on("connect", (data) => {
          done();
        });
        playerIO.connect();
      });

    });

    describe('TEST', () => {

      it('OK', (done) => {
        const
          response = (msg) => {
            expect(msg).to.be.instanceOf(Object);
            expect(msg).to.have.all.keys("playerId", "gameId", "teamId", "nick", "playedArray");
            done();
          };
        playerIO.on("player.reconnect", response);
        const
          data = {
            gamePin,
            playerPin,
          };
        playerIO.emit("playerReconnect", {request: data});
      });

    });

  });

  describe('TEACHER RESTART GAME', () => {

    const onEvent = "sync.timer";

    describe('TEST', () => {

      it('OK', (done) => {
        const response = (msg) => {
            console.error(`currentTime => ${msg.currentTime}`);
            done();
          };
        clientIO.on(onEvent, response);
        let data = {
          status: 'started',
        };
        clientIO.emit("game.status.change", {request: data});
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