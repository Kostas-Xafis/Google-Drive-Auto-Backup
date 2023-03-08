import { Stats, statSync } from "fs";
import { Nullable } from "../globals";
import { ACTIONS, resultHandler } from "./logs";
export async function getModificationTimeFromFile(path: string): Promise<number> {
	let err: any, data: Nullable<Stats>;
	try {
		data = statSync(path);
	} catch (error) {
		err = error;
	} finally {
		resultHandler(ACTIONS.READ_LOC_FILE, { comment: ` for file: ${path}`, err });
		return data?.mtimeMs ? data.mtimeMs : NaN;
	}
}
