import clc from "cli-color";
import cliProgress, { SingleBar } from "cli-progress";
import { sleep } from "../globals";

const updateQueue: number[] = [];
export async function initBar(totalsize: number, command: string, totalFiles: number) {
	let size = 0;
	let prevSize = 0;
	let files = 0;
	const bar = new cliProgress.SingleBar(
		{
			stopOnComplete: true,
			format: `${command} ` + clc.blue("{bar}") + " {percentage}% | {value}/{total} KB | Files {files}/{totalFiles}"
		},
		cliProgress.Presets.shades_classic
	);
	bar.start(toKB(totalsize), 0, {
		files: "0",
		totalFiles
	});

	while (true) {
		if (updateQueue.length !== 0) {
			size += updateQueue.shift() || 0; // The || 0 is for ts
			files++; //Files with 0 size wouldn't be counted so i put it here (fun time debugging 🙄🔫)
		}
		if (size === totalsize) {
			bar.update(toKB(totalsize), { files });
			break;
		}
		if (prevSize === size) {
			await sleep(50);
			continue;
		}
		prevSize = size;
		bar.update(toKB(size), { files });
	}
}

const toKB = (n: number) => Math.round(n / 1024);

export const updateBar = (addSize: number) => {
	updateQueue.push(addSize);
};
