import * as path from 'path';

const chai: any = require('chai'),
  chaiHTTP = require('chai-http'),
  config = require(path.resolve('devConfig.json'));

chai.use(chaiHTTP);
const expect = chai.expect, io = require('socket.io-client'),
  baseURL = `http://localhost:${config.server.port}`;

describe('9.9.BeerGame_RemoveParticipantGroup', () => {

  let loggedUser, clientIO, gamePin, game;

  const mapPlayers = new Map();

  function studentEnter(msg) {
    console.log(`aluno nick: ${msg.success.nick} => pin: ${msg.success.pin} entrou no jogo`);
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
            {
              name: 'group 3',
            },
            {
              name: 'group 4',
            },
          ])
          .end((error, response) => {
            gamePin = response.body.data[0].pin;
            game = response.body.data[0];
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

  const toEnter = {
      gameId: null,
      teamId: null,
      positionId: null,
    };
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

  function studentEnterOnGame() {
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
          resolve(response.body.data.nick);
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

  describe('STUDENTS ENTER', () => {

    it('enter', (done) => {
      readAvailableGame().then(async () => {
        while (await checkHasPosition()) {
          await studentEnterOnGame();
        }
        await connectStudents();
        done();
      });
    });

  });

  describe('TEACHER START GAME', () => {

    describe('TEST', () => {

      it('students game event', (done) => {
        for (let player of mapPlayers.values()) {

          player.socket.on("game.status.changed", (msg) => {
            console.log(`Game ${msg.success.gameStatus} escutado pelo aluno ${player.nick}`);
          });

          player.socket.on("disconnect", (msg) => {
            player.socket.removeAllListeners();
            player.socket = null;
            console.log(`Player ${player.nick} deconectado`);
          });

        }
        done();
      });

      it('teacher events', (done) => {

        clientIO.on("game.status.changed", (msg) => {
          console.log(`Game ${msg.response.success.gameStatus} escutado pelo professor`);

          clientIO.off('game.player.removed');
          clientIO.off('game.group.removed');

          clientIO.on("game.group.removed", (msg) => {
            const
              removedTeam = game.teams.filter(team => team.id === msg.response.success.teamId);
            console.log(`Grupo ${removedTeam[0].nick} removido`);
            done();
          });

          clientIO.on("game.player.removed", (msg) => {
            console.log(`não é possivle remover o jogador error: ${msg.response.error}`);

            clientIO.emit("game.group.remove", {
              teamId: game.teams[0].id,
            });

          });

          clientIO.emit('game.player.remove', {
            teamId: game.teams[0].id,
            playerId: game.teams[0].players[0].id,
          });
        });

        clientIO.on("game.player.removed", async (msg) => {
          const
            team = game.teams.filter(team => team.id === msg.response.success.teamId),
            removedPlayer = team[0].players.filter(player => player.id === msg.response.success.playerId);
          team[0].players = team[0].players.filter(player => player.id !== msg.response.success.playerId);
          console.log(`Jogador ${removedPlayer[0].playerType} id: ${removedPlayer[0].id} removido`);
          await checkHasPosition();
          const
            nick = await studentEnterOnGame(),
            player = mapPlayers.get(nick),
            playerIO = io(baseURL);
          playerIO.on("connect", () => {
            const
              response = (msg) => {
                player.socket = playerIO;
                console.log(`Player ${player.nick} conectado com sucesso!`);

                player.socket.on("game.status.changed", (msg) => {
                  console.log(`Game ${msg.success.gameStatus} escutado pelo aluno ${player.nick}`);
                });

                player.socket.on("disconnect", (msg) => {
                  player.socket.removeAllListeners();
                  player.socket = null;
                  console.log(`Player ${player.nick} deconectado`);
                });

                let data = {
                  status: 'started',
                };
                clientIO.emit("game.status.change", {request: data});

              };
            playerIO.on("response", response);
            let data = {
              ...player,
            };
            playerIO.emit("playerEnter", {request: data});
          });
          playerIO.connect();
        })

        clientIO.on("game.group.removed", (msg) => {
          const
            removedTeam = game.teams.filter(team => team.id === msg.response.success.teamId);
          game.teams = game.teams.filter(team => team.id !== msg.response.success.teamId);
          console.log(`Grupo ${removedTeam[0].nick} removido`);
          clientIO.emit('game.player.remove', {
            teamId: game.teams[0].id,
            playerId: game.teams[0].players[0].id,
          });
        });

        clientIO.emit("game.group.remove", {
          teamId: game.teams[0].id,
        });

      });

    });

  });

});