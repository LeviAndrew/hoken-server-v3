'use strict';

const greenlock = require('greenlock-express');
const leChallengeFs = require('le-challenge-fs');
const leStoreCertbot = require('le-store-certbot');

export class Greenlock {
	
	private readonly _lex: any;
	
	constructor() {
		
		this._lex = greenlock.create({

      version: 'v02',
      // server: 'https://acme-staging-v02.api.letsencrypt.org/directory', // Staging
      server: 'https://acme-v02.api.letsencrypt.org/directory', // Production
			challenges: {'http-01': leChallengeFs.create({webrootPath: '/tmp/acme-challenges'})},
			store: leStoreCertbot.create({webrootPath: '/tmp/acme-challenges'}),
			approveDomains: Greenlock.approveDomains
		});

		console.log(this._lex.server.indexOf('staging') === -1 ? 'Greenlock gerando certificados' : 'Greenlock em ambiente de testes');

	}
	
	get lex() {
		return this._lex;
	}
	
	private static approveDomains(opts, certs, cb) {
		if (certs) {
			opts.domains = certs.altnames;
		}
		else {
			opts.domains = ['www.inserirDominioAqui.com.br', 'inserirDominioAqui.com.br'];
			opts.email = 'inserirEmailAqui@gmail.com';
			opts.agreeTos = true;
		}
		cb(null, {options: opts, certs: certs});
	}
	
}