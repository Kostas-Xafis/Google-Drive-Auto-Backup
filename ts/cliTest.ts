import { stdin, stdout } from "process";
import readline from "readline";
import { sleep } from "./globals";
import cliProgress from "cli-progress";

(async function () {
	const rl = readline.createInterface({
		input: stdin,
		output: stdout
	});

	const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	bar.start(200, 0);
	await sleep(1000);
	bar.update(100);
	await sleep(1000);
	bar.update(200);
	await sleep(500);
	bar.stop();
})();
