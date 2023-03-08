import { Nullable, __maindir, silentConsole } from "../globals";
import fs from "fs";
import clc from "cli-color";
const { clg } = silentConsole;
export const enum ACTIONS {
	FOLDER_CREATION = "FOLDER CREATION",
	FOLDER_DELETION = "FOLDER DELETION",
	FOLDER_SEARCH = "FOLDER SEARCH",
	FOLDER_UPDATE = "FOLDER UPDATE",

	FILE_CREATION = "FILE CREATION",
	FILE_DOWNLOAD = "FILE DOWNLOAD",

	READ_LOC_FILE = "READ LOCAL FILE",
	WRITE_LOC_FILE = "WRITE LOCAL FILE",

	BACKUP_DOWNLOAD = "BACKUP DOWNLOAD",
	BACKUP_DELETE = "BACKUP DELETE",
	BACKUP_UPDATE = "BACKUP UPDATE",
	FULL_BACKUP_UPDATE = "FULL BACKUP UPDATE"
}

type Error = Nullable<object> | unknown;
type LogMsg = {
	comment?: string;
	err?: Error;
};

let silent = false;
export const errorCounter = {
	errors: 0
};

export function setSilentLogs() {
	silent = true;
}

export function updateLogs(action: string, msg: LogMsg): void {
	const { comment, err } = msg;
	const str =
		"==========================================\n" +
		Date() +
		"\n" +
		action +
		(comment != null ? comment : "") +
		(err != null ? ":\t" + JSON.stringify(err, null, 2) : "") +
		"\n\n";
	fs.appendFile(__maindir + "/logs.log", str, { encoding: "utf-8" }, err => {
		if (err) console.log(err);
	});
}

export function resultHandler(id: string, msg: LogMsg): void {
	const { comment, err } = msg;
	if (!err && !silent) {
		updateLogs("SUCCESSFUL action " + id, { comment });
	} else if (err) {
		updateLogs("ERROR at action " + id, { comment, err });
		clg(clc.redBright("An error occured with action: ") + id);
		errorCounter.errors++;
	}
}

export function warnErrors() {
	if (errorCounter.errors === 0) return;
	console.log(`Encountered ${errorCounter.errors} errors. Please check the logs file to inspect them.`);
	console.log("If you think this is some sort of a bug, then feel free to make an issue at the projects' repo.");
}
