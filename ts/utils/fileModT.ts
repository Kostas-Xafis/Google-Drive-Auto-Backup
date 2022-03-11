import { Stats, statSync } from "fs";
import { Nullable } from "../globals";
import { actions, resultHandler } from "./logs";
export async function getModificationTimeFromFile(path: string): Promise<number> {
	let err: any, data: Nullable<Stats>;
	try {
		data = statSync(path);
	} catch (error) {
		err = error;
	} finally {
		resultHandler(actions.READ_LOC_FILE, err);
		return data?.mtimeMs ? data.mtimeMs : NaN;
	}
}
