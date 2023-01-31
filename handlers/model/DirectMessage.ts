import {Drive} from "./Drive";
import {FindObject} from "../util/FindObject";
import {UpdateObject} from "../util/UpdateObject";

export class DirectMessage extends Drive {

  public async createMessage(param: defaultParam<direct>) {
    const
      permittedSendTo = [
        "users", "entityId"
      ],
      model = "directMessage",
      required = this.attributeValidator([
        "auth", "aKey", "entityId", "data",
        [
          "sendBy", "title", "subject", "sendTo", "$or",
          permittedSendTo
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      let newSendTo = [], newEntityId = [];
      if(param.data.sendTo.entityId){
        for(var i = 0; i < param.data.sendTo.entityId.length; i++){
          const
          retEntity = await this.sendToServer("db.entity.read", new FindObject({
            query: param.data.sendTo.entityId[i],
            select: "users",
          })),
          mapSendTo = retEntity.data.success.users.map(
            user => user.toString()
          )
        newSendTo = newSendTo.concat(mapSendTo)
        newEntityId.push(param.data.sendTo.entityId[i])
        }
        newEntityId.push(param.entityId)
        newEntityId = newEntityId.filter((id, i) => newEntityId.indexOf(id) === i); // remover duplicações
        newSendTo = newSendTo.filter((id, i) => newSendTo.indexOf(id) === i); // remover duplicações
      }
      else {
        newSendTo = param.data.sendTo.users
        newEntityId.push(param.entityId)
      }
      const sendById = await this.getUserIdByAuth(param.auth)
      const
        ret = await this.sendToServer("db.directMessage.create", {
          sendBy: sendById,
          sendTo: newSendTo,
          entityId: newEntityId,
          title: param.data.title,
          subject: param.data.subject,
          sendDate: new Date().getTime(),
          hasAttachment: param.data.hasAttachment
        })
      this.checkHubReturn(ret.data)
      if (!param.data.hasAttachment) this.sendToServer("mailSession.send", ret.data.success);
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

  public async sendMessageWithAttachment(param: defaultParam<{ messageId: string, dest: string, documentName: string }>) {
    const
      model = "directMessage",
      required = this.attributeValidator([
        "auth", "aKey", "entityId", "data",
        [
          "messageId", "dest", "documentName",
        ]
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        ret = await this.sendToServer("db.directMessage.update", new UpdateObject({
          query: param.data.messageId,
          update: {
            $push: {
              "subject.attachments": param.data.dest
            },
            sendDate: new Date().getTime(),
          },
        }))
      this.checkHubReturn(ret.data)
      const mailRet = await this.sendToServer("mailSession.send", [{
        ...ret.data.success,
        documentName: param.data.documentName
      }])
      this.checkHubReturn(mailRet.data)
      await this.sendToServer("db.user.update", new UpdateObject({
          query: {
            _id: {
              $in: ret.data.success.sendTo
            }
          },
          update: {
            $addToSet: {
              emails: ret.data.success.id
            }
          }
        }
      ))
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

  public async readUserAvailableMails(param: defaultParam<null>) {
    const
      model = "directMessage",
      required = this.attributeValidator([
        "auth", "aKey", "entityId"
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const query = await this.getUserIdByAuth(param.auth),
        ret = await this.sendToServer("db.user.read", new FindObject({
          query,
          select: "emails id",
          populate: [
            {
              path: "emails",
              select: "sendBy title subject id sendDate entityId",
              populate: [{
                path: "sendBy",
                select: "name surname email id"
              }]
            }
          ]
        }));
      const
        retMailsUser = ret.data.success.emails.filter(email => email.entityId.toString().includes(param.entityId));
      ret.data.success.emails = retMailsUser;
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

  public async readUserSentMails(param: defaultParam<null>) {
    const
      model = "directMessage",
      required = this.attributeValidator([
        "auth", "aKey", "entityId"
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const 
        user = await this.getUserIdByAuth(param.auth),
        ret = await this.sendToServer("db.directMessage.read", new FindObject({
          query: {
            sendBy: {
              $in: user
            }
          },
          select: "sendTo title subject id sendDate entityId",
          populate: [{
            path: "sendTo",
            select: "name surname email id"
          }]
        })),
        retMailsEntity = ret.data.success.filter(email => email.entityId.toString().includes(param.entityId));
      ret.data.success = retMailsEntity;
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

  public async readAllUserMails(param: defaultParam<null>) {
    const
      model = "directMessage",
      required = this.attributeValidator([
        "auth", "aKey", "entityId"
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const
        user = await this.getUserIdByAuth(param.auth),
        currentDate = new Date(),
        lastYearDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate()),
        promises = await Promise.all([
          this.sendToServer('db.user.read', new FindObject({
            query: user,
            select: 'id emails',
          })),
          this.sendToServer("db.directMessage.read", new FindObject({
            query: {
              sendTo: {
                $in: user
              },
              createdAt: {
                $gte: lastYearDate,
              }
            },
            select: 'hasAttachment sendBy title subject.message id sendDate entityId',
            populate: [
              {
                path: 'sendBy',
                select: 'name surname email id',
              }
            ],
          })),
        ]);
      promises.forEach(promise => {
        this.checkHubReturn(promise.data);
      });
      const
        myMsgSet = new Set(promises[0].data.success.emails.map(email => email.toString())),
        retMailsUser = promises[1].data.success.filter(email => !myMsgSet.has(email.id)),
        emails = retMailsUser.filter(email => email.entityId.toString().includes(param.entityId));
      return await this.returnHandler({
        model,
        data: {
          success: {
            emails,
            id: user,
          },
        },
      });
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }

  public async updateUserReadMails(param: defaultParam<mails>) {
    const
      model = "directMessage",
      required = this.attributeValidator([
        "auth", "aKey", "entityId",
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const user = await this.getUserIdByAuth(param.auth),
        ret = await this.sendToServer("db.user.update", new UpdateObject({
            query: {
              _id: {
                $in: user
              }
            },
            update: {
              $pull: {
                emails: {
                  $in: param.data.mailId
                }
              }
            }

          }
        ))
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

  public async deleteScheduledDirectMessage(param: defaultParam<deleteMail>) {
    const currentDate = new Date(),
      now = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours()).getTime(),
      model = "directMessage",
      required = this.attributeValidator([
        "auth", "aKey", "entityId"
      ], param);
    if (!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      const dateDif = param.data.sendDate - now  //dif de 1hora ou mais = pode deletar
      if (dateDif >= 3600000) {
        const ret = await this.sendToServer("db.directMessage.delete", new FindObject({
          query: param.data.id
        }))
        return await this.returnHandler({
          model,
          data: ret.data
        });
      }
    } catch (e) {
      return await this.returnHandler({
        model,
        data: {error: e.message || e},
      });
    }
  }
}

export default new DirectMessage();

interface defaultParam<T> {
  auth: string,
  aKey: string,
  entityId: string,
  data: T,
}

interface direct {
  sendBy: string,
  sendTo: {
    users?: [string],
    entityId?: string,
  },
  title: string,
  subject: {
    message?: string,
    attachments?: [string]
  },
  sendDate?: number,
  hasAttachment?: boolean
}

interface mails {
  mailId: string
}

interface deleteMail {
  id: string,
  sendDate: number
}

