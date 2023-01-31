const superagent = require('superagent');
const path = require('path');
const config = require(path.resolve('config.json'));

export class Authy {
	private static _api_key: string = config.authy.api_key;
	private static _api_url: string = "https://api.authy.com";

	static get api_key(): string {
		return this._api_key;
	}

	static get api_url(): string {
		return this._api_url;
	}

	static set api_key(value: string) {
		this._api_key = value;
	}

	static set api_url(value: string) {
		this._api_url = value;
	}

	public static async verification_start(phone_number, country_code, params) {
		params = params || {};

		let options = {
			phone_number: phone_number,
			country_code: country_code,
			via: params.via || "sms",
			locale: params.locale,
			custom_message: params.custom_message,
			code_length: params.code_length
		};

		return this.post("/protected/json/phones/verification/start", options);
	}

	public static async verification_check(phone_number, country_code, verification_code) {
		let options = {
			phone_number: phone_number,
			country_code: country_code,
			verification_code: verification_code
		};
		return this.get("/protected/json/phones/verification/check", options);
	}

	private static async get(path, params) {
		params.api_key = this.api_key;
		return new Promise((resolve, reject) => {
			superagent
				.get(this.api_url + path)
				.send(params)
				.end((err, response) => {
					if (err) {
						reject(err);
					} else {
						resolve(response.body);
					}
				});
		});
	}

	private static async post(path, params) {
		params.api_key = this.api_key;
		return new Promise((resolve, reject) => {
			superagent
				.post(this.api_url + path)
				.send(params)
				.end((err, response) => {
					if (err) {
						reject(err);
					} else {
						resolve(response.body);
					}
				});
		});
	};
}