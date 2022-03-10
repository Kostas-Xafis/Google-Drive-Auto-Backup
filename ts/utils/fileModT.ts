import { Stats } from "fs";
import { stat } from "fs/promises";
import { Nullable } from "../globals";
import { actions, resultHandler } from "./logs";
export async function getModificationTimeFromFile(path: string): Promise<number> {
	let err: any, data: Nullable<Stats>;
	try {
		data = await stat(path);
	} catch (error) {
		err = error;
	} finally {
		resultHandler(actions.READ_LOC_FILE, err);
		return data?.mtimeMs ? data.mtimeMs : NaN;
	}
}
