import clc from "cli-color";
import cliProgress from "cli-progress";
import { sleep } from "./globals";

// note: you have to install this dependency manually since it's not required by cli-progress
(async function () {
	const b1 = new cliProgress.SingleBar({
		format: "CLI Progress |" + clc.cyan("{bar}") + "| {percentage}% || {value}/{total} Chunks || Speed: {speed}",
		barCompleteChar: "\u2588",
		barIncompleteChar: "\u2591",
		hideCursor: true
	});

	// initialize the bar - defining payload token "speed" with the default value "N/A"
	b1.start(200, 0, {
		speed: "N/A"
	});

	// update values
	b1.increment();
	b1.update(20);

	await sleep(2000);

	// stop the bar
	b1.stop();
})();
