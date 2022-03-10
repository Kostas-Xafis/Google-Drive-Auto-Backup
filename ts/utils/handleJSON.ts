import { writeFile, readFile } from "fs/promises";
import { actions, resultHandler } from "./logs";

export async function readJSONFile(dir: string): Promise<any> {
	let err: any, data;
	try {
		data = JSON.parse(await readFile(dir, { encoding: "utf-8" }));
	} catch (error) {
		err = error;
	} finally {
		resultHandler(actions.READ_LOC_FILE, err);
		return data;
	}
}

export async function writeJSONFile(dir: string, obj: object): Promise<void> {
	try {
		await writeFile(dir, JSON.stringify(obj, null, 2), { encoding: "utf-8" });
	} catch (error) {
		console.log("Couldn't write to " + dir);
		resultHandler(actions.WRITE_LOC_FILE, error);
	}
}
