import {BasicHandler} from "../BasicHandler";
import {FindObject} from '../util/FindObject';
import {Application} from '../../Application';
import { cpf } from 'cpf-cnpj-validator'; 
import * as ldap from 'ldapjs';
import * as path from 'path';

export class OpenHandler extends BasicHandler {

  public async getLocale (data) {
    let dataLocale = Application.getPathI18N();
    let i18n = data.i18n ? data.i18n : dataLocale.defaultI18N;
    let ret = await this.getI18N({path: path.resolve(`${dataLocale.mainPath}/${i18n}/${dataLocale.i18n}`)});
    return await this.returnHandler({
      model: 'global',
      data: ret
    })
  }

  public async loginHoken (data: loginData): Promise<returnData> {
    let required = this.attributeValidator(['login', 'password'], data), ret;
    if(!required.success) return await this.getErrorAttributeRequired(required.error);
    try {
      ret = await this.sendToServer('db.user.login', {
        password: data.password,
        queryObject: new FindObject({
          query: {
            $or:[
              {
                email: data.login,
              },
              {
                'document.documentNumber': data.login,
              },
              {
                matriculation: data.login,
              },
            ],
            removed: false,
          },
          select: 'id name surname email birthday matriculation document authenticationKey drive.canUpdate',
        }),
      });
      if(ret.data.error && ret.data.error !== 'userNotFound') {
        if(cpf.isValid(data.login)) {
          const userLdapSetic:any = await this.authenticate(data.login, data.password);
          if (userLdapSetic.success) {
            ret = await this.sendToServer('db.user.login', {
              password: 'ldap',
              queryObject: new FindObject({
                query: {
                  $or:[
                    {
                      email: data.login,
                    },
                    {
                      'document.documentNumber': data.login,
                    },
                    {
                      matriculation: data.login,
                    },
                  ],
                  removed: false,
                },
                select: 'id name surname email birthday matriculation document authenticationKey drive.canUpdate',
              }),
            });
            if(ret.data.error) throw new Error('emailOrPasswordInvalid');
          } else throw new Error('emailOrPasswordInvalid');
        } else throw new Error('emailOrPasswordInvalid');
      }
      if(ret.data.error && !cpf.isValid(data.login) || ret.data.error === 'userNotFound') throw new Error('emailOrPasswordInvalid');
      let accessKey = await this.sendToServer('accessSession.create', ret.data.success.authenticationKey);
      if(accessKey.data.error) return await this.returnHandler({
        model: 'user',
        data: accessKey.data,
      });
      ret.data.success.accessKey = accessKey.data.success;
      return await this.returnHandler({
        model: 'user',
        data: ret.data,
      });
    } catch (e) {
      return await this.returnHandler({
        model: 'user',
        data: {error: e.message || e},
      })
    }
  }

  public authenticate (cn, password) {
    return new Promise((resolve, reject) => {
      let client, dn = 'sysacc-labtic', senha = 'A6UW$WU4!<TCUa--@(A$Q-_Ke_y9xNz7FpqUCbE)q#cMSvNW+G';
      try {
        client = ldap.createClient({
          url: 'ldap://dc-02-reitoria.corp.udesc.br',
          reconnect: true,
        });
      } catch (e) {
        resolve({error: e});
      }
      try {
        client.bind(dn, senha, (err, res) => {
          if(err) {
            client.unbind();
            resolve({error: err});
          }

          const opts = {
            scope: 'sub',
            filter: `(&(objectClass=*)(CN=${cn}))`,
            attributes: [
              'cn',
              'department',
              'description',
              'displayName',
              'mail',
              'o',
              'title',
              'userPrincipalName',
            ],
          };

          client.search('dc=corp,dc=udesc,dc=br', opts, (err, res) => {
            if(err) {
              client.unbind();
              resolve({error: err});
            }

            res.on('searchEntry', entry => {
              try {
                const object: any = entry.object;
                client.bind(object.dn, password, (err, res) => {
                  if(err) {
                    client.unbind();
                    resolve({error: err});
                  }

                  client.unbind();
                  resolve({success: object});
                });
              } catch (e) {
                resolve({error: e});
              }
            });

            res.on('error', err => {
              client.unbind();
              resolve({error: err});
            });
          });

        });
      } catch (e) {
        !!client && client.destroy();
        resolve({error: e});
      }
    });
  }

}

interface returnData {
  success: boolean,
  data: any
}

interface loginData {
  login: string,
  password: string
}

export default new OpenHandler();