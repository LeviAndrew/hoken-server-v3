import {EventEmitter2, ListenerFn} from "eventemitter2";
import {Message} from "./Message";
import * as BBPromise from "bluebird";
import {Source} from "./Source";
import * as path from 'path';

export class Hub {
	eventemitter: EventEmitter2;
	private static instance: Hub;

	private constructor() {
    let config:any = require(path.resolve("config.json"));
    this.eventemitter = new EventEmitter2(config.eventConfig);
	}

	/**
	 * Adds a listener to the end of the listeners array for the specified event.
	 * @param event
	 * @param listener
	 */
	public on(event: string, listener: ListenerFn): Hub {
		this.eventemitter.on(event, listener);
		return this;
	}

	/**
	 * Adds a one time listener for the event.
	 * The listener is invoked only the first time the event is fired, after which it is removed.
	 * @param event
	 * @param listener
	 */
	public once(event: string, listener: ListenerFn): Hub {
		this.eventemitter.once(event, listener);
		return this;
	}

	/**
	 * Remove a listener from the listener array for the specified event.
	 * Caution: changes array indices in the listener array behind the listener.
	 * @param event
	 * @param listener
	 */
	public un(event: string, listener: ListenerFn): Hub {
		this.eventemitter.off(event, listener);
		return this;
	}

	/**
	 * Send a message into the HUB.
	 *
	 * @param source
	 * @param event
	 * @param data
	 * @param previous
	 * @return {Message}
	 */
	public send(source: Source, event: string, data, previous?: string): Message {
		// @ts-ignore
		if (!source || (typeof source !== "object" && !(source instanceof Source))) {
			throw new Error("To send message through Hub, the source is required " +
				"and must extend Source");
		}

		let msg = new Message(source.id, event, data, previous);
		process.nextTick(() => {
			try {
				this.eventemitter.emit(event, msg);
			} catch (e) {
				console.error("Tentando enviar dados para um HUB Destruido", event, source, e);
			}
		});

		return msg;
	}

	public destroy(): BBPromise<boolean> {
		return new BBPromise<boolean>((resolve) => {
			Hub.instance = null;
			this.eventemitter.removeAllListeners();
			this.eventemitter = null;
			resolve(true);
		});
	}

	public static getInstance(): Hub {
		if (!Hub.instance) {
			Hub.instance = new Hub();
		}

		return Hub.instance;
	}
}