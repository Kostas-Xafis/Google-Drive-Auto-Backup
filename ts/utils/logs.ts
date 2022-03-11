import { Nullable, __maindir } from "../globals";
import fs from "fs";
import clc from "cli-color";

export const enum actions {
	FOLDER_CREATION = "FOLDER CREATION",
	FOLDER_DELETION = "FOLDER DELETION",
	FOLDER_SEARCH = "FOLDER SEARCH",
	FOLDER_UPDATE = "FOLDER UPDATE",

	FILE_CREATION = "FILE CREATION",
	FILE_DOWNLOAD = "FILE DOWNLOAD",

	READ_LOC_FILE = "READ LOCAL FILE",
	WRITE_LOC_FILE = "WRITE LOCAL FILE"
}

type Error = Nullable<object> | unknown;

let silent = false;

export function setSilentLogs() {
	silent = true;
}

function updateLogs(action: string, err: Error): void {
	const str =
		"==========================================\n" +
		Date() +
		"\n" +
		action +
		":\t" +
		(err != null ? JSON.stringify(err, null, 2) : "") +
		"\n\n";
	fs.appendFile(__maindir + "/logs.log", str, { encoding: "utf-8" }, err => {
		if (err) console.log(err);
	});
}

export function resultHandler(id: string, err?: Error): void {
	if (!err && !silent) {
		updateLogs("SUCCESSFUL action " + id, null);
	} else {
		updateLogs("ERROR at action " + id, err);
		console.log(clc.redBright("An error occured with action: ") + id);
	}
}
