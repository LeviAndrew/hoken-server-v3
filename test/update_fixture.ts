import {TestManager} from "./TestManager";
import * as path from "path";
import * as fs from "fs";

let testManager = null;

describe('Teste de manager país', () => {
	before(function(done) {
		testManager = new TestManager(done);
	});

	after(async function() {
		await testManager.destroy();
	});

	it('1. popula banco', async () => {
		let file = require(path.resolve("fixtures/Produto.json"));

		for (let i = 0; i < file.data.length; ++i) {
			let rng = Math.random();
			file.data[i].disponivel = rng > 0.5;
		}

		fs.writeFileSync(path.resolve("fixtures/Produto.json"), JSON.stringify(file));
	});
});