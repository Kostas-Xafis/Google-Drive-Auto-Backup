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
		if (updateQueue.length !== 0) size += updateQueue.pop() || 0;

		if (size === totalsize) {
			files++;
			bar.update(toKB(totalsize), { files, fileName: "Done" });
			break;
		}
		if (prevSize === size) {
			await sleep(50);
			continue;
		}
		prevSize = size;
		files++;
		bar.update(toKB(size), { files });
	}
}

const toKB = (n: number) => Math.round(n / 1024);

export const updateBar = (addSize: number, file: string) => updateQueue.push(addSize);
