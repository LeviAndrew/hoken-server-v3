import {BasicHandler} from '../handlers/BasicHandler'
import {FindObject} from "../handlers/util/FindObject";
import * as path from "path";
import {UpdateObject} from "../handlers/util/UpdateObject";

export class MailSender extends BasicHandler {
  private readonly _name: string;
  private readonly _transporter
  private nodemailer = require('nodemailer');

  constructor() {
    super();
    this._name = "mailSession";
    this._transporter = this.nodemailer.createTransport({
      service: process.env.MAIL_SERVICE,
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: { rejectUnauthorized: false }
    });
    this.wiring();
  }

  private get name() {
    return this._name;
  }

  private get transporter() {
    return this._transporter
  }


  private async sendDirectMessage(msg) {
    if (msg.source_id === this.id) return;
    try {
      const
        emailData = msg.data.success[0],
        sendToEmails = await this.sendToServer("db.user.read", new FindObject({
          query: {
            _id: {
              $in: emailData.sendTo
            }
          },
          select: 'email'
        })),
        sendByEmail = await this.sendToServer("db.user.read", new FindObject({
          query: {
            _id: {
              $in: emailData.sendBy
            }
          },
          select: 'email'
        }));
      this.checkHubReturn(sendToEmails.data);
      let
        mailOptions: any = {
          // from: process.env.MAIL_USER,
          from: sendByEmail.data.success[0].email,
          to: sendToEmails.data.success.map((user) => user.email),
          subject: emailData.title,
          // text: emailData.subject.message,
          // html: msg.data.success.message
          html: emailData.subject.message,
        };
      if (emailData.subject.attachments.length > 0) {
        mailOptions["attachments"] = emailData.subject.attachments.map((attach) => {
          return {
            filename: emailData.documentName,
            path: path.resolve(attach)
          }
        })
      }
      await this.sendToServer("db.user.update", new UpdateObject({
        query: {
          _id: {
            $in: emailData.sendTo
          }
        },
        update: {
          $addToSet: {
            emails: msg.data.success[0].id,
          }
        }
      }))
      const
        mail = await this.sendMail(mailOptions);
      this.answer(msg.id, msg.event, mail, null);
    } catch (e) {
      this.answer(msg.id, msg.event, null, e);
    }
  }

  sendMail(mailOptions) {
    return new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions, (error, info) => {
        if (error) return reject(error);
        return resolve(info);
      });
    })
  }

  answer(messageId, event, success, error) {
    let data = {
      success: success,
      error: error
    };
    this.hub.send(this, event, data, messageId);
  }

  wiring() {
    this.hub.on(`${this.name}.send`, this.sendDirectMessage.bind(this));
  }

}