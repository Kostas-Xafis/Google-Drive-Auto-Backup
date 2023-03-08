import { writeFile, readFile, access, mkdir } from "fs/promises";
import { dirname } from "path";
import { ACTIONS, resultHandler } from "./logs";
import { silentConsole } from "../globals";
const { clg } = silentConsole;
export async function readJSONFile<T>(dir: string): Promise<T> {
	let err, data;
	try {
		data = JSON.parse(await readFile(dir, { encoding: "utf-8" }));
	} catch (error) {
		err = error;
	} finally {
		resultHandler(ACTIONS.READ_LOC_FILE, { comment: ` for file: ${dir}`, err });
		return data;
	}
}

export async function writeJSONFile(dir: string, obj: object): Promise<void> {
	let err;
	try {
		await access(dirname(dir));
	} catch (error) {
		await mkdir(dirname(dir), { recursive: true });
	} finally {
		try {
			await writeFile(dir, JSON.stringify(obj, null, 2), { encoding: "utf-8" });
		} catch (error) {
			err = error;
			clg("Couldn't write to " + dir);
		}
		resultHandler(ACTIONS.WRITE_LOC_FILE, { comment: ` for file: ${dir}`, err });
	}
}
