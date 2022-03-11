import cliProgress, { SingleBar } from "cli-progress";
import { sleep } from "../globals";

let size = 0;
let prevSize = 0;
let bar: SingleBar;
const queue: number[] = [];

export async function initBar(totalsize: number) {
	bar = new cliProgress.SingleBar({ stopOnComplete: true }, cliProgress.Presets.shades_classic);
	bar.start(totalsize, 0);
	while (true) {
		//@ts-ignore
		if (queue.length !== 0) size += queue.pop();

		if (size === totalsize) {
			bar.update(totalsize);
			break;
		}
		if (prevSize === size) {
			await sleep(50);
			continue;
		}
		prevSize = size;
		bar.update(size);
	}
}

export const updateBar = (addSize: number) => queue.push(addSize);
