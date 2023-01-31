import * as path from "path";
import * as superagent from "superagent";
const config = require(path.resolve("config.json"));

export class OneSignal {
	private static rest_api_key: string = config.onesignal.rest_api_key;
	private static app_id: string = config.onesignal.app_id;

	public static async sendToDevice(device_id, data) {
		return new Promise((resolve, reject) => {
			if (!Array.isArray(device_id)) {
				device_id = [device_id];
			}

			console.log(OneSignal.app_id);

			let send_message = {
				app_id: OneSignal.app_id,
				headings: {"en": data.title},
				contents: {"en": data.message},
				data: data.additional_data,
				include_player_ids: device_id
			};

			superagent
				.post("https://onesignal.com/api/v1/notifications")
				.set("Content-Type", "application/json; charset=utf-8")
				.set("Authorization", `Basic ${OneSignal.rest_api_key}`)
				.send(send_message)
				.end((err, response) => {
					if (err) {
						return reject(err);
					}

					resolve(response.body);
				});
		})
	}
}