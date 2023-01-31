import {Drive} from "./Drive";
import {FindObject} from "../util/FindObject";
import {UpdateObject} from "../util/UpdateObject";
import * as fs from "fs";
import * as path from "path";
import {ObjectId, Schema, Types} from "mongoose";
import {QueryObject} from "../util/QueryObject";

export class CollaborativeWork extends Drive {

  private _folderName = "Trabalho colaborativo";

  public async createCollaborativeWork(param: defaultParam<createCollaborativeWork>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "name"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      if (param.data.initVisibilityDate || param.data.endVisibilityDate) this.checkDate({
        initDate: param.data.initVisibilityDate,
        endDate: param.data.endVisibilityDate,
      });
      if (param.data.initAnswerDate || param.data.endAnswerDate) {
        this.checkDate({
          initDate: param.data.initAnswerDate,
          endDate: param.data.endAnswerDate,
        });
        if (param.data.initVisibilityDate && param.data.initAnswerDate) this.numberComparator({
          valueOne: param.data.initVisibilityDate,
          symbol: '<=',
          valueTwo: param.data.initAnswerDate,
          errorMessage: 'visibilityAndAnswerInitDatesInvalid'
        });
        if (param.data.endVisibilityDate && param.data.endAnswerDate) this.numberComparator({
          valueOne: param.data.endVisibilityDate,
          symbol: '>=',
          valueTwo: param.data.endAnswerDate,
          errorMessage: 'visibilityAndAnswerEndDatesInvalid'
        });
      }
      const collaborativeWorkAnswer = await this.sendToServer('db.collaborativeWorkAnswer.create', {});
      this.checkHubReturn(collaborativeWorkAnswer.data);
      const
        owner = await this.getUserIdByAuth(param.auth),
        collaborativeWork = await this.sendToServer('db.collaborativeWork.create', {
          owner,
          entityId: param.entityId,
          name: param.data.name,
          description: param.data.description,
          initVisibilityDate: param.data.initVisibilityDate,
          endVisibilityDate: param.data.endVisibilityDate,
          public: param.data.public,
          answer: collaborativeWorkAnswer.data.success[0].id,
        });
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: collaborativeWork.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: {error: e.message || e},
      });
    }
  }

  public async createAnswer(param: defaultParam<createCollaborativeWorkAnswer>) {
    const
      model = 'collaborativeWorkAnswer',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", "data",
        [
          "collaborativeWorkAnswerId", "answer",
          [
            'title',
          ]
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        _id = new Types.ObjectId().toString(),
        answerId = new Types.ObjectId().toString(),
        currentDate = new Date().getTime(),
        userId = await this.getUserIdByAuth(param.auth),
        collaborativeWorkAnswer = await this.sendToServer('db.collaborativeWorkAnswer.update', new UpdateObject({
          query: param.data.collaborativeWorkAnswerId,
          update: {
            $addToSet: {
              teams: {
                _id,
                participants: {
                  user: userId,
                  accepted: true,
                },
                answers: {
                  _id: answerId,
                  title: param.data.answer.title,
                  comment: param.data.answer.comment,
                  sendDate: currentDate,
                  sendBy: userId
                },
              },
            }
          }
        }));
      this.checkHubReturn(collaborativeWorkAnswer.data);
      let ret;
      for (let i = 0; i < collaborativeWorkAnswer.data.success.teams.length; i++) {
        if (collaborativeWorkAnswer.data.success.teams[i]._id.toString() === _id) {
          ret = collaborativeWorkAnswer.data.success.teams[i];
          for (let j = 0; j < ret.answers.length; j++) {
            if (ret.answers[j]._id.toString() === answerId) {
              ret['answer'] = ret.answers[j];
            }
          }
          delete ret.answers;
          break;
        }
      }
      return await this.returnHandler({
        model,
        data: {success: ret},
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async createTeam(param: defaultParam<{ collaborativeWorkAnswerId: string }>) {
    const
      model = 'collaborativeWorkAnswer',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", "data",
        [
          "collaborativeWorkAnswerId"
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        _id = new Types.ObjectId().toString(),
        collaborativeWorkAnswer = await this.sendToServer('db.collaborativeWorkAnswer.update', new UpdateObject({
          query: param.data.collaborativeWorkAnswerId,
          update: {
            $addToSet: {
              teams: {
                _id,
              },
            }
          }
        }));
      this.checkHubReturn(collaborativeWorkAnswer.data);
      return await this.returnHandler({
        model,
        data: {success: collaborativeWorkAnswer.data.success.teams},
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async createLinkCollaborativeWork(param: defaultParam<createLink>) {
    const
      model = 'collaborativeWork',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", "data",
        [
          "collaborativeWork", "externalLink", [
            "name", "link"
          ]
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const userDrive = await this.getUserDrive(param.auth),
      collaborativeWorkFolder = await this.readCollaborativeWorkFolder({
        auth: param.auth,
        aKey: param.auth,
        entityId: param.entityId,
        data: null,
      });
      this.checkHubReturn(collaborativeWorkFolder.data);
      this.checkHubReturn(userDrive.data);
      const
        newLink = await this.createDBDriveLink({
          userId: userDrive.data.success.id,
          name: param.data.externalLink.name,
          link: param.data.externalLink.link,
          parentId: collaborativeWorkFolder.data.folder.id,
          parentPath: `${process.env.DRIVE_PATH}/${userDrive.data.success.id}`,
        });
      this.checkHubReturn(newLink.data);
      const
        collaborativeWork = await this.sendToServer('db.collaborativeWork.update', new UpdateObject({
          query: param.data.collaborativeWork,
          update: {
            $addToSet: {
              externalLink: newLink.data.success[0].id
            },
          },
          select: ['id', 'name', 'externalLink'],
          populate: [
            {
              path: 'externalLink',
              select: 'id name link date',
            },
          ]
        }));
      return await this.returnHandler({
        model,
        data: collaborativeWork.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async addCollaborativeWorkFile(param: defaultParam<addCollaborativeWorkFile>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "collaborativeWorkId", "fileId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const collaborativeWork = await this.sendToServer('db.collaborativeWork.update', new UpdateObject({
        query: param.data.collaborativeWorkId,
        update: {
          $addToSet: {
            file: param.data.fileId,
          }
        },
      }));
      this.checkHubReturn(collaborativeWork.data);
      const file = await this.sendToServer('db.file.read', new FindObject({
        query: param.data.fileId,
        select: 'name extension date size'
      }));
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: file.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: {error: e.message || e},
      });
    }
  }

  public async checkExistCollaborativeWork(param: { collaborativeWorkId: string }) {
    const
      model = 'collaborativeWork',
      required = this.attributeValidator([
        "collaborativeWorkId"
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const collaborativeWork = await this.sendToServer('db.collaborativeWork.read', new FindObject({
        query: param.collaborativeWorkId,
      }));
      if (!collaborativeWork.data.success) throw new Error('invalidCollaborativeWork');
      return await this.returnHandler({
        model,
        data: collaborativeWork.data,
      })
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async readCollaborativeWorkFolder(param: defaultParam<null>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId"
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const userDrive = await this.getUserDrive(param.auth);
      this.checkHubReturn(userDrive.data);
      const collaborativeWorkFolder = await this.getCollaborativeWorkFolder({
        userId: userDrive.data.success.id,
        folders: userDrive.data.success.drive.root.folders,
      });
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: {
          success: {
            userId: userDrive.data.success.id,
            folder: collaborativeWorkFolder,
          }
        },
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: {error: e.message || e},
      });
    }
  }

  public async readCollaborativeWorkAnswerFolder(param: defaultParam<{ collaborativeWorkAnswerId: string, answerId: string }>) {
    const
      model = 'collaborativeWork',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", 'data',
        [
          "collaborativeWorkAnswerId", 'answerId'
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        userId = await this.getUserIdByAuth(param.auth),
        exist = await this.sendToServer('db.collaborativeWorkAnswer.count', new QueryObject({
          query: {
            _id: param.data.collaborativeWorkAnswerId,
            "teams.participants.user": userId,
            "teams.answers._id": param.data.answerId,
          }
        }));
      this.checkHubReturn(exist.data);
      return await this.returnHandler({
        model,
        data: {
          success: this.getCollaborativeWorkAnswerPath(param.data.collaborativeWorkAnswerId),
        },
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async setCollaborativeWorkAnswerFile(param: defaultParam<{ collaborativeWorkAnswerId: string, answerId: string, teamId: string, fileName: string, filePath }>) {
    const
      model = 'collaborativeWork',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", 'data',
        [
          "collaborativeWorkAnswerId", 'answerId', 'teamId',
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        userId = await this.getUserIdByAuth(param.auth),
        ret = await this.sendToServer('db.collaborativeWorkAnswer.updateAnswerFile', {
          query: {
            id: param.data.collaborativeWorkAnswerId,
            teamId: param.data.teamId,
            teamAnswerId: param.data.answerId,
          },
          update: {
            name: param.data.fileName,
            path: param.data.filePath,
            sendBy: userId,
          }
        });
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async updateAnswerData(param: defaultParam<{ collaborativeWorkAnswerId: string, answerId: string, teamId: string, answer: any, userLabel: string, userActions: [ObjectId] }>) {
    const
      model = 'collaborativeWork',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", 'data',
        [
          "collaborativeWorkAnswerId", 'teamId', "answer",
          [
            'title',
          ]
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        userId = await this.getUserIdByAuth(param.auth),
        dbAnswer = await this.sendToServer('db.collaborativeWorkAnswer.read', new FindObject({
          findOne: true,
          query: {
            id: param.data.collaborativeWorkAnswerId,
          },
          select: 'id teams',
        }));
      if (!dbAnswer.data.success || !dbAnswer.data.success.teams.length || dbAnswer.data.error) return await this.returnHandler({
        model,
        data: {error: 'cannotUpdateAnswer',}
      });
      const
        team = dbAnswer.data.success.teams.filter(team => team._id.toString() === param.data.teamId);
      // const
      //   acao = [param.data.userActions.filter(acao => acao.label === "Corrigir trabalhos collaborativos")[0]];
      if (!team.length) return await this.returnHandler({
        model,
        data: {error: 'invalidTeam'}
      }); 
      let 
        myTeam = false, 
        file = [];
      team[0].participants.forEach(part=>{
        if(userId === part.user.toString()) myTeam = true;
      });
      if(param.data.userLabel === 'Professor' || param.data.userLabel === 'Monitor') myTeam = true;
      // if(!acao.length) myTeam = true;
      if(!myTeam) return await this.returnHandler({model, data: {error: 'invalidTeam'}});
      const
        answer = team[0].answers.filter(answer => answer._id.toString() === param.data.answerId);
      if (param.data.answerId) {
        if (!answer.length) return await this.returnHandler({
          model,
          data: {error: 'invalidAnswer'}
        });
        file = answer[0].files;
      };      
      const
        currentDate = new Date().getTime(),
        answerId = new Types.ObjectId().toString(),
        ret = await this.sendToServer('db.collaborativeWorkAnswer.updateAnswerData', {
          query: {
            id: param.data.collaborativeWorkAnswerId,
            teamId: param.data.teamId,
          },
          update: {
            _id: answerId,
            title: param.data.answer.title,
            comment: param.data.answer.comment,
            sendDate: currentDate,
            sendBy: userId,
            files: file,
          }
        });
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async updateParticipants(param: defaultParam<{ collaborativeWorkAnswerId: string, teamId: string, participantId: string }>) {
    const
      model = 'collaborativeWork',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", 'data',
        [
          "collaborativeWorkAnswerId", 'teamId', "participantId",
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        dbAnswer = await this.sendToServer('db.collaborativeWorkAnswer.read', new FindObject({
          findOne: true,
          query: {
            id: param.data.collaborativeWorkAnswerId,
          },
          select: 'id teams maxPerTeam',
        }));
      if (!dbAnswer.data.success || !dbAnswer.data.success.teams.length || dbAnswer.data.error) return await this.returnHandler({
        model,
        data: {error: 'cannotUpdateTeam',}
      });
      const
        team = dbAnswer.data.success.teams.filter(team => team._id.toString() === param.data.teamId);
      let exist = false;
      team[0].participants.forEach(part=>{
        if(param.data.participantId === part.user.toString()) exist = true;
      });
      if(exist) return await this.returnHandler({
        model,
        data: {error: 'User is already a member of the team',}
      });
      let alreadyMember = false;
      const member = dbAnswer.data.success.teams.forEach((team) => {
        team.participants.forEach((user) => {
          if (param.data.participantId === user.user.toString())
            alreadyMember = true;
        });
      });
      if (alreadyMember)
        return await this.returnHandler({
          model,
          data: { error: 'User is already a member of another team' },
        });
      const
        capacity = dbAnswer.data.success.maxPerTeam;
      let limited = false;
      if(capacity <= team[0].participants.length) limited = true;
      if(limited) return await this.returnHandler({
        model,
        data: {error: 'The team is already at full capacity',}
      });
      const
        newId = new Types.ObjectId().toString(),
        ret = await this.sendToServer('db.collaborativeWorkAnswer.updateParticipants', {
          query: {
            id: param.data.collaborativeWorkAnswerId,
            teamId: param.data.teamId,
          },
          update: {
            accepted: true,
            newParticipant: param.data.participantId,
            _id: newId,
          }
        });
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async addDriveFile(param: defaultParam<addDriveFile>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "collaborativeWorkId", "fileId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const files = await this.sendToServer('db.file.read', new FindObject({
        query: {
          _id: {
            $in: param.data.fileId,
          }
        },
        select: 'id _id name extension date size'
      }));
      this.checkHubReturn(files.data);
      if (!files.data.success.length) throw new Error('fileNotFound');
      const collaborativeWork = await this.sendToServer('db.collaborativeWork.update', new UpdateObject({
        query: param.data.collaborativeWorkId,
        update: {
          $addToSet: {
            file: {$each: files.data.success.map(file => file.id),}
          }
        },
      }));
      this.checkHubReturn(collaborativeWork.data);
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: files.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: {error: e.message || e},
      });
    }
  }

  public async addDriveLink(param: defaultParam<addDriveLink>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "collaborativeWorkId", "linkId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const links = await this.sendToServer('db.externalLink.read', new FindObject({
        query: {
          _id: {
            $in: param.data.linkId,
          }
        },
        select: 'id _id name link date'
      }));
      this.checkHubReturn(links.data);
      if (!links.data.success.length) throw new Error('linkNotFound');
      const collaborativeWork = await this.sendToServer('db.collaborativeWork.update', new UpdateObject({
        query: param.data.collaborativeWorkId,
        update: {
          $addToSet: {
            externalLink: {$each: links.data.success.map(link => link.id),}
          }
        },
      }));
      this.checkHubReturn(collaborativeWork.data);
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: links.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: {error: e.message || e},
      });
    }
  }

  public async readAll(param: defaultParam<null>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId"
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const collaborativeWork = await this.sendToServer('db.collaborativeWork.read', new FindObject({
        query: {
          entityId: param.entityId,
        },
        select: 'public owner name description answer id externalLink file initVisibilityDate endVisibilityDate',
        populate: [
          {
            path: 'file',
            select: 'id _id name extension date size',
          },
          {
            path: 'externalLink',
            select: 'id _id name link date',
          },
          {
            path: 'answer',
            select: 'initDate endDate maxPerTeam teams',
            populate: [
              {
                path: 'teams.users',
                select: "name surname email matriculation"
              },
              {
                path: 'teams.answers.file',
                select: 'id _id name extension date size',
              }
            ]
          }
        ]
      }));
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: collaborativeWork.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: {error: e.message || e},
      });
    }
  }

  public async readAllAvailable(param: defaultParam<null>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId"
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        currentTime = new Date().getTime(),
        collaborativeWork = await this.sendToServer('db.collaborativeWork.read', new FindObject({
          query: {
            $and: [
              {
                entityId: param.entityId,
              },
              {
                $or: [
                  {
                    initVisibility: {
                      $lte: currentTime,
                    },
                    endVisibilityDate: {
                      $gte: currentTime,
                    },
                  },
                  {
                    initVisibility: {
                      $lte: currentTime,
                    },
                    endVisibilityDate: {
                      $exists: false,
                    },
                  },
                  {
                    initVisibility: {
                      $exists: false,
                    },
                    endVisibilityDate: {
                      $gte: currentTime,
                    },
                  },
                  {
                    initVisibility: {
                      $exists: false,
                    },
                    endVisibilityDate: {
                      $exists: false,
                    },
                  },
                ]
              }
            ],
          },
          select: 'public owner name description id externalLink file' +
            ' initVisibilityDate endVisibilityDate answer',
          populate: [
            {
              path: 'file',
              select: 'id _id name extension date size',
            },
            {
              path: 'externalLink',
              select: 'id _id name link date',
            },
          ]
        }));
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: collaborativeWork.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: {error: e.message || e},
      });
    }
  }

  public async readAnswerDetail(param: defaultParam<{ collaborativeWorkId: string }>) {
    const
      model = "collaborativeWorkAnswer",
      required = this.attributeValidator([
        "auth", "aKey", "entityId"
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        userId = await this.getUserIdByAuth(param.auth);
      let
        ret = await this.sendToServer('db.collaborativeWork.aggregate', [
          // @ts-ignore
          {$match: {_id: new Types.ObjectId(param.data.collaborativeWorkId)}},
          {$project: {answer: 1}},
          {
            $lookup: {
              from: "collaborativeworkanswers",
              localField: "answer",
              foreignField: "_id",
              as: "answer"
            }
          },
          {$unwind: "$answer"},
          {$unwind: "$answer.teams"},
          // @ts-ignore
          {$match: {"answer.teams.participants.user": new Types.ObjectId(userId)}},
          {$unwind: "$answer.teams.answers"},
          {$unwind: "$answer.teams.answers.files"},
          {
            $lookup: {
              from: "users",
              let: {user: "$answer.teams.answers.files.sendBy"},
              pipeline: [{$match: {$expr: {$eq: ["$_id", "$$user"]}}}, {
                $project: {
                  name: 1,
                  id: 1,
                  surname: 1
                }
              }],
              as: "answer.teams.answers.files.sendBy"
            }
          },
          {
            $group: {
              _id: "$_id",
              "collaborativeWorkAnswerId": {$first: "$answer.id"},
              "maxPerTeam": {$first: "$answer.maxPerTeam"},
              "initialDate": {$first: "$answer.initialDate"},
              "endDate": {$first: "$answer.endDate"},
              "teamId": {$first: "$answer.teams._id"},
              "participants": {$first: "$answer.teams.participants"},
              "answers": {$push: "$answer.teams.answers"},
            },
          },
          {$unwind: "$participants"},
          {
            $lookup: {
              from: "users",
              let: {user: "$participants.user"},
              pipeline: [{$match: {$expr: {$eq: ["$_id", "$$user"]}}}, {
                $project: {
                  name: 1,
                  id: 1,
                  surname: 1
                }
              }],
              as: "participants.user"
            }
          },
          {
            $group: {
              _id: "$_id",
              "collaborativeWorkAnswerId": {$first: "$collaborativeWorkAnswerId"},
              "maxPerTeam": {$first: "$maxPerTeam"},
              "initialDate": {$first: "$initialDate"},
              "endDate": {$first: "$endDate"},
              "teamId": {$first: "$teamId"},
              "participants": {$push: "$participants"},
              "answers": {$first: "$answers"},
            },
          },
          {
            $project: {
              "_id": 1,
              "collaborativeWorkAnswerId": 1,
              "maxPerTeam": 1,
              "initialDate": 1,
              "endDate": 1,
              "teamId": 1,
              "participants": 1,
              "answers._id": 1,
              "answers.title": 1,
              "answers.comment": 1,
              "answers.sendDate": 1,
              "answers.files._id": 1,
              "answers.files.name": 1,
              "answers.files.timestamp": 1,
              "answers.files.sendBy": 1,
            }
          },
        ]);
      if (ret.data.error) return await this.returnHandler({
        model,
        data: ret.data
      });
      if (!ret.data.success.length) ret = await this.sendToServer('db.collaborativeWork.aggregate', [
        // @ts-ignore
        {$match: {_id: new Types.ObjectId(param.data.collaborativeWorkId)}},
        {$project: {answer: 1}},
        {
          $lookup: {
            from: "collaborativeworkanswers",
            localField: "answer",
            foreignField: "_id",
            as: "answer"
          }
        },
        {$unwind: "$answer"},
        {
          $group: {
            _id: "$_id",
            "collaborativeWorkAnswerId": {$first: "$answer.id"},
            "maxPerTeam": {$first: "$answer.maxPerTeam"},
            "initialDate": {$first: "$answer.initialDate"},
            "endDate": {$first: "$answer.endDate"},
            "teamId": {$first: "$answer.teams._id"},
          },
        }
      ]);
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async downloadCollaborativeWorkFile(param: defaultParam<readCollaborativeWorkFile>) {
    const
      model = 'collaborativeWork',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", "data",
        [
          "collaborativeWorkId", "fileId",
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const collaborativeWork = await this.sendToServer('db.collaborativeWork.read', new FindObject({
        query: param.data.collaborativeWorkId,
        select: 'file',
        populate: [
          {
            path: 'file',
            select: 'path name extension'
          }
        ]
      }));
      this.checkHubReturn(collaborativeWork.data);
      if (!collaborativeWork.data.success.file) return await this.returnHandler({
        model,
        data: {error: 'withoutFile'}
      });
      let file;
      for (let i = 0; i < collaborativeWork.data.success.file.length; i++) {
        if (collaborativeWork.data.success.file[i].id === param.data.fileId) {
          file = collaborativeWork.data.success.file[i];
          break;
        }
      }
      if (!file) return await this.returnHandler({
        model,
        data: {error: 'invalidFile'}
      });
      return await this.returnHandler({
        model,
        data: {success: file},
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async downloadFileAnswer(param: defaultParam<readCollaborativeWorkAnswerFile>) {
    const
      model = 'collaborativeWork',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", "data",
        [
          "collaborativeWorkAnswerId", "teamId", "answerId", "fileId",
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const collaborativeWorkAnswer = await this.sendToServer('db.collaborativeWorkAnswer.read', new FindObject({
        query: param.data.collaborativeWorkAnswerId,
        select: 'teams',
        populate: [
          {
            path: 'teams',
            select: '_id answers',
            populate: [
              {
                path: 'answers',
                select: 'files'
              }
            ]
          }
        ]
      }));
      if (!collaborativeWorkAnswer.data.success || !collaborativeWorkAnswer.data.success.teams.length || collaborativeWorkAnswer.data.error) return await this.returnHandler({
        model,
        data: {error: 'cannotDownloadFileAnswer',}
      });
      this.checkHubReturn(collaborativeWorkAnswer.data);
      const
        team = collaborativeWorkAnswer.data.success.teams.filter(team => team._id.toString() === param.data.teamId);
      if (!team.length) return await this.returnHandler({
        model,
        data: {error: 'invalidTeam'}
      });
      const
        answer = team[0].answers.filter(answer => answer._id.toString() === param.data.answerId);
      if (!answer.length) return await this.returnHandler({
        model,
        data: {error: 'invalidAnswer'}
      });
      const
        arquivo = answer[0].files.filter(file => file._id.toString() === param.data.fileId);
      if (!arquivo.length) return await this.returnHandler({
        model,
        data: {error: 'withoutFile'}
      });
      let file;
      for (let i = 0; i < arquivo.length; i++) {
        if (arquivo[i]._id.toString() === param.data.fileId) {
          file = arquivo[i];
          break;
        }
      }
      if (!file) return await this.returnHandler({
        model,
        data: {error: 'invalidFile'}
      });
      return await this.returnHandler({
        model,
        data: {success: file},
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async downloadZipAnswers(param: defaultParam<{ collaborativeWorkId: string }>) {
    const
      model = 'collaborativeWork',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", "data",
        [
          "collaborativeWorkId",
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        selectUser = 'name surname',
        collaborativeWork = await this.sendToServer('db.collaborativeWork.read', new FindObject({
          query: param.data.collaborativeWorkId,
          select: 'answer name',
          populate: [
            {
              path: 'answer',
              select: 'teams.participants teams.answers',
              populate: [
                {
                  path: 'teams.participants.user',
                  select: selectUser,
                },
                {
                  path: 'teams.answers.files.sendBy',
                  select: selectUser,
                }
              ]
            }
          ]
        }));
      this.checkHubReturn(collaborativeWork.data);
      const
        zipArray: any = [
          {
            content: `Nesse zip estão todas as respostas enviadas da atividade ${collaborativeWork.data.success.name}`,
            name: 'README.txt',
            mode: 775,
            comment: 'Arquivos zipados das respostas',
            date: new Date(),
            type: 'file'
          }
        ];
      collaborativeWork.data.success.answer.teams.forEach(team => {
        const
          lastFileAnswer = team.answers[0].files[team.answers[0].files.length - 1];
        if (!lastFileAnswer || !lastFileAnswer.path) return
        zipArray.push({
          path: lastFileAnswer.path,
          name: `${lastFileAnswer.sendBy.name} ${lastFileAnswer.sendBy.surname ? lastFileAnswer.sendBy.surname : ''}${path.extname(lastFileAnswer.path)}`
        });
      });
      return await this.returnHandler({
        model,
        data: {
          success: {
            filename: `${collaborativeWork.data.success.name}.zip`,
            files: zipArray,
          }
        },
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async updateInfos(param: defaultParam<updateInfos>) {
    const
      permittedCollaborativeWork = ["name", "description", "initVisibilityDate", "endVisibilityDate", "public"];
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "id", "update", "$or",
        [
          ...permittedCollaborativeWork
        ]
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      if (param.data.update.initVisibilityDate || param.data.update.endVisibilityDate) this.checkDate({
        initDate: param.data.update.initVisibilityDate,
        endDate: param.data.update.endVisibilityDate,
      });
      const collaborativeWork = await this.sendToServer('db.collaborativeWork.update', new UpdateObject({
        query: param.data.id,
        update: this.getUpdateObject(permittedCollaborativeWork, param.data.update),
        select: [...permittedCollaborativeWork, "id"],
      }));
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: collaborativeWork.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: {error: e.message || e},
      });
    }
  }

  public async updateAnswerInfos(param: defaultParam<updateAnswer>) {
    const
      permittedAnswer = ["maxPerTeam", "initialDate", "endDate"];
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "id", "update", "$or",
        permittedAnswer
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const collaborativeWork = await this.sendToServer('db.collaborativeWork.read', new FindObject({
        query: param.data.id,
        select: 'answer initVisibleDate endVisibleDate',
      }));
      this.checkHubReturn(collaborativeWork.data);
      if (param.data.update.initialDate || param.data.update.endDate) {
        this.checkDate({
          initDate: param.data.update.initialDate,
          endDate: param.data.update.endDate,
        });
        if (param.data.update.initialDate && collaborativeWork.data.success.initVisibilityDate) this.numberComparator({
          valueOne: collaborativeWork.data.success.initVisibilityDate,
          symbol: '<=',
          valueTwo: param.data.update.initialDate,
          errorMessage: 'visibilityAndAnswerInitDatesInvalid'
        });
        if (param.data.update.endDate && collaborativeWork.data.success.endVisibilityDate) this.numberComparator({
          valueOne: collaborativeWork.data.success.endVisibilityDate,
          symbol: '>=',
          valueTwo: param.data.update.endDate,
          errorMessage: 'visibilityAndAnswerEndDatesInvalid'
        });
      }
      const answer = await this.sendToServer('db.collaborativeWorkAnswer.update', new UpdateObject({
        query: collaborativeWork.data.success.answer.toString(),
        update: this.getUpdateObject(permittedAnswer, param.data.update),
        select: [...permittedAnswer, "id"],
      }));
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: answer.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: {error: e.message || e},
      });
    }
  }

  public async updateExternalLink(param: defaultParam<updateExternalLink>) {
    const
      model = 'collaborativeWork',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", "data",
        [
          "id", "linkId", "update", "$or",
          [
            "name", 'link'
          ]
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const link = await this.sendToServer('db.externalLink.update', new UpdateObject({
        query: param.data.linkId,
        update: {
          name: param.data.update.name,
          link: param.data.update.link,
        },
        select: ['link', 'id', 'name'],
      }));
      this.checkHubReturn(link.data);
      const ret = await this.sendToServer('db.collaborativeWork.read', new FindObject({
        query: param.data.id,
        select: 'externalLink id name',
        populate: [{
          path: 'externalLink',
          select: 'id name link updatedAt',
        }],
      }));
      // this.checkHubReturn(ret.data);
      // let toUpdate = {};
      // for (let attr in param.data.update) {
      //   if (param.data.update.hasOwnProperty(attr)) toUpdate[attr] = param.data.update[attr];
      // }
      // const collaborativeWork = await this.sendToServer('db.collaborativeWork.read', new FindObject({
      //   query: param.data.id,
      //   select: 'externalLink'
      // }));
      // this.checkHubReturn(collaborativeWork.data);
      // if (!collaborativeWork.data.success.externalLink) return await this.returnHandler({
      //   model,
      //   data: {error: 'withoutExternalLink'}
      // });
      // const
      //   externalLink = collaborativeWork.data.success.externalLink.map(link => {
      //     if (link._id.toString() === param.data.linkId) return {...link, ...toUpdate};
      //     return link;
      //   }),
      //   ret = await this.sendToServer('db.collaborativeWork.update', new UpdateObject({
      //     query: param.data.id,
      //     update: {
      //       externalLink,
      //     },
      //     select: ['externalLink', 'id'],
      //   }));
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async removeFile(param: defaultParam<{ id: string, fileId: string }>) {
    const
      model = 'collaborativeWork',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", "data",
        [
          "id", "fileId"
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const collaborativeWork = await this.sendToServer('db.collaborativeWork.read', new FindObject({
        query: param.data.id,
        select: 'file'
      }));
      this.checkHubReturn(collaborativeWork.data);
      let fileToRemove;
      const file = collaborativeWork.data.success.file.filter(file => {
        if (file.toString() !== param.data.fileId) return true;
        fileToRemove = file;
      });
      if (!fileToRemove) return await this.returnHandler({
        model,
        data: {error: 'invalidFile'}
      });
      const ret = await this.sendToServer('db.collaborativeWork.update', new UpdateObject({
        query: param.data.id,
        update: {
          file,
        },
        select: ['id', 'name', 'file'],
      }));
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async deleteCollaborativeWork(param: defaultParam<{ id: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "id"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        collaborativeWork = await this.sendToServer('db.collaborativeWork.read', new FindObject({
          query: param.data.id,
          select: 'answer',
          populate: [
            {
              path: 'answer',
              select: 'id',
            }
          ]
        }));
      this.checkHubReturn(collaborativeWork.data);
      const answer = await this.sendToServer('db.collaborativeWorkAnswer.delete', new FindObject({
        // query: collaborativeWork.data.success.answer.toString(),
        query: collaborativeWork.data.success.answer.id,
      }));
      this.checkHubReturn(answer.data);
      const ret = await this.sendToServer('db.collaborativeWork.delete', new FindObject({
        query: param.data.id,
      }));
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: {error: e.message || e},
      });
    }
  }

  public async removeLink(param: defaultParam<{ id: string, linkId: string }>) {
    const
      model = 'collaborativeWork',
      required = this.attributeValidator([
        "auth", "aKey", "entityId", "data",
        [
          "id", "linkId"
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const collaborativeWork = await this.sendToServer('db.collaborativeWork.read', new FindObject({
        query: param.data.id,
        select: 'externalLink'
      }));
      this.checkHubReturn(collaborativeWork.data);
      let linkToRemove;
      const externalLink = collaborativeWork.data.success.externalLink.filter(link => {
        if (link._id.toString() !== param.data.linkId) return true;
        linkToRemove = link;
      });
      if (!linkToRemove) return await this.returnHandler({
        model,
        data: {error: 'invalidLink'}
      });
      const ret = await this.sendToServer('db.collaborativeWork.update', new UpdateObject({
        query: param.data.id,
        update: {
          externalLink,
        },
        select: ['externalLink', 'id', 'name'],
      }));
      return await this.returnHandler({
        model,
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async deleteAnswer(param: defaultParam<{ answerId: string, answer: string, teamId: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "answerId", "answer", "teamId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const answer = await this.sendToServer('db.collaborativeWorkAnswer.deleteAnswer', param.data)
      this.checkHubReturn(answer.data);
      return await this.returnHandler({
        model: 'collaborativeWorkAnswer',
        data: answer.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWorkAnswer',
        data: {error: e.message || e},
      });
    }
  }

  public async deleteParticipant(param: defaultParam<{ answerId: string, teamId: string, participantId: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "answerId", "teamId", "participantId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const participant = await this.sendToServer('db.collaborativeWorkAnswer.deleteParticipant', param.data)
      this.checkHubReturn(participant.data);
      return await this.returnHandler({
        model: 'collaborativeWorkAnswer',
        data: participant.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWorkAnswer',
        data: {error: e.message || e},
      });
    }
  }

  public async readCollaborativeWorkSentAnswers(param: defaultParam<{ collaborativeWorkId: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "collaborativeWorkId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        ret = await this.sendToServer('db.collaborativeWork.read', new FindObject({
          query: param.data.collaborativeWorkId,
          select: 'answer',
          populate: [
            {
              path: 'answer',
              select: 'maxPerTeam id teams',
              populate: [
                {
                  path: 'teams.participants.user',
                  select: 'name surname birthday email matriculation' +
                    ' document id',
                },
              ],
            },
          ],
        }));
      this.checkHubReturn(ret.data);
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: {error: e.message || e},
      });
    }
  }

  public async readCollaborativeWorkAvailableAnswers(param: defaultParam<{ collaborativeWorkAnswerId: string }>) {
    let required = this.attributeValidator([
      "auth", "aKey", "entityId", "data",
      [
        "collaborativeWorkAnswerId"
      ]
    ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        userId = await this.getUserIdByAuth(param.auth),
        ret = await this.sendToServer('db.collaborativeWorkAnswer.read', new FindObject({
          query: param.data.collaborativeWorkAnswerId,
          select: 'id teams',
        }));
      this.checkHubReturn(ret.data);
      let exist = false;
      const
        team = ret.data.success.teams.forEach(time => { 
          time.participants.forEach(part => {
          if(userId === part.user.toString()) {
            ret.data.success.teams = time;
            exist = true;
          }
          });
        });;
      if(!exist) return await this.returnHandler({
        model: 'collaborativeWork', data: {error: 'user without team'}});
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'collaborativeWork',
        data: {error: e.message || e},
      });
    }
  }

  private async getCollaborativeWorkFolder(userFolders: userRootFolders) {
    try {
      const
        foldersMap = new Map(
          userFolders.folders.map(folder => {
            return [folder.name, folder];
          })
        ),
        collaborativeWorkName = `${this._folderName} ${userFolders.userId}`;
      let collaborativeWorkFolder: any = foldersMap.get(collaborativeWorkName);
      if (!collaborativeWorkFolder) {
        collaborativeWorkFolder = await this.createUserCollaborativeWork({
          userId: userFolders.userId,
        });
      }
      return collaborativeWorkFolder;
    } catch (e) {
      throw new Error(e);
    }
  }

  private async createUserCollaborativeWork(param: { userId: string }) {
    try {
      const
        collaborativeWorkId = new Types.ObjectId().toString(),
        pathBase = `${process.env.DRIVE_PATH}/${param.userId}`,
        supportResourceFolder = await this.sendToServer('db.folder.create', {
          owner: param.userId,
          name: `${this._folderName} ${param.userId}`,
          path: path.resolve(`${pathBase}/${collaborativeWorkId}`),
          date: new Date().getTime(),
          _id: collaborativeWorkId,
        });
      this.checkHubReturn(supportResourceFolder.data);
      this.createUserCollaborativeWorkSOFolder({
        userId: param.userId,
        collaborativeWorkId
      });
      const user = await this.sendToServer('db.user.update', new UpdateObject({
        query: param.userId,
        update: {
          $addToSet: {
            'drive.root.folders': collaborativeWorkId,
          }
        },
        select: ['id', '_id', 'drive.root'],
        populate: [
          {
            path: 'drive.root.folders',
            select: 'name path id _id'
          }
        ]
      }));
      this.checkHubReturn(user.data);
      return supportResourceFolder.data.success[0];
    } catch (e) {
      throw new Error(e);
    }
  }

  private async getUserDrive(authenticationKey) {
    try {
      let user = await this.sendToServer('db.user.read', new FindObject({
        findOne: true,
        query: {
          authenticationKey,
        },
        select: 'drive id _id',
        populate: [
          {
            path: 'drive.root.folders',
            select: 'name path id _id'
          }
        ]
      }));
      this.checkHubReturn(user.data);
      if (!user.data.success.drive ||
        !user.data.success.drive.hasRoot) user = await this.createUserDrive(user.data.success.id);
      return user;
    } catch (e) {
      throw new Error(e);
    }
  }

  private createUserCollaborativeWorkSOFolder(param: { userId: string, collaborativeWorkId: string }) {
    try {
      const pathBase = `${process.env.DRIVE_PATH}/${param.userId}/${param.collaborativeWorkId}`;
      if (fs.existsSync(path.resolve(pathBase))) return;
      fs.mkdirSync(path.resolve(pathBase));
    } catch (e) {
      throw new Error(e);
    }
  }

  private getCollaborativeWorkAnswerPath(collaborativeWorkAnswerId: string) {
    const answersPath = path.resolve(`${process.env.COLLABORATIVE_WORK_ANSWERS_PATH}/${collaborativeWorkAnswerId}`);
    if (!fs.existsSync(answersPath)) fs.mkdirSync(answersPath);
    return answersPath;
  }

  private async createUserDrive(userId: string) {
    const collaborativeWorkId = new Types.ObjectId().toString();
    try {
      Drive.createUserRoot(userId);
      const
        pathBase = `${process.env.DRIVE_PATH}/${userId}`,
        supportResourceFolder = await this.sendToServer('db.folder.create', {
          owner: userId,
          name: `${this._folderName} ${userId}`,
          path: path.resolve(`${pathBase}/${collaborativeWorkId}`),
          date: new Date().getTime(),
          _id: collaborativeWorkId,
        });
      this.checkHubReturn(supportResourceFolder.data);
      this.createUserCollaborativeWorkSOFolder({
        userId,
        collaborativeWorkId,
      });
      const user = await this.sendToServer('db.user.update', new UpdateObject({
        query: userId,
        update: {
          drive: {
            hasRoot: true,
            root: {
              folders: [collaborativeWorkId],
            }
          }
        },
        select: ['id', '_id', 'drive.root'],
        populate: [
          {
            path: 'drive.root.folders',
            select: 'name path id _id'
          }
        ]
      }));
      this.checkHubReturn(user.data);
      return user;
    } catch (e) {
      await this.sendToServer('db.folder.delete', new FindObject({
        query: collaborativeWorkId,
      }));
      throw new Error(e);
    }
  }

  private checkDate(param: visibilityDate) {
    const currentDate = new Date().getTime();
    if (param.endDate && param.endDate <= currentDate) throw new Error('invalidEndDate');
    if (param.initDate && param.initDate && (param.endDate <= param.initDate)) throw new Error('invalidInitDate');
  }

  private numberComparator(param: numberComparatorParam) {
    if (!eval(`${param.valueOne}
    ${param.symbol}
    ${param.valueTwo}`)) throw new Error(param.errorMessage);
  }

}

export default new CollaborativeWork();

interface defaultParam<T> {
  auth: string,
  aKey: string,
  entityId: string,
  data: T,
}

interface visibilityDate {
  initDate?: number,
  endDate?: number,
}

interface createCollaborativeWork {
  name: string,
  description?: string,
  initVisibilityDate?: number,
  endVisibilityDate?: number,
  initAnswerDate?: number,
  endAnswerDate?: number,
  public?: boolean,
}

interface numberComparatorParam {
  valueOne: number,
  symbol: '<=' | '>=',
  valueTwo: number,
  errorMessage: string,
}

interface userRootFolders {
  userId: string,
  folders: driveFolder[],
}

interface driveFolder {
  _id: string,
  id: string,
  name: string,
  path: string,
}

interface readCollaborativeWorkFile {
  collaborativeWorkId: string,
  fileId: string,
}

interface readCollaborativeWorkAnswerFile {
  collaborativeWorkAnswerId: string,
  teamId: string,
  answerId: string,
  fileId: string,
}

interface addCollaborativeWorkFile extends readCollaborativeWorkFile {
  fileId: string,
}

interface addExternalLink extends readCollaborativeWorkFile {
  name: string,
  link: string,
}

interface addDriveFile extends readCollaborativeWorkFile {
  fileId: string,
}

interface addDriveLink extends readCollaborativeWorkFile {
  linkId: string,
}

interface updateInfos {
  id: string,
  update: {
    name?: string,
    description?: string,
    initVisibilityDate?: number,
    endVisibilityDate?: number,
    public?: boolean,
  }
}

interface updateAnswer {
  id: string,
  update: {
    initialDate?: number,
    endDate?: number,
    maxPerTeam: number,
  }
}

interface createLink {
  collaborativeWork: string,
  externalLink: {
    name: string,
    link: string,
  }
}

interface updateExternalLink {
  id: string,
  linkId: string,
  update: {
    name?: string,
    link?: string,
  }
}

interface createCollaborativeWorkAnswer {
  "collaborativeWorkAnswerId": string,
  "answer": {
    "title": string,
    "comment"?: string
  }
}