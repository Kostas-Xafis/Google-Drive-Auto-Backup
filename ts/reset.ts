// THIS FILE IS NOT PART OF THE PROJECT.

import { unlink } from "fs/promises";
import { argv } from "process";
import { BackupFile, __maindir } from "./globals";
import { initAuth } from "./utils/auth";
import { removeFile, setDrive } from "./utils/driveQueries";
import { readJSONFile, writeJSONFile } from "./utils/handleJSON";
import { actions, resultHandler, updateLogs } from "./utils/logs";

(async () => {
	try {
		const buf: BackupFile = await readJSONFile(__maindir + "json/backupFile.json");
		const dir = argv[2];
		const id = buf.ids[dir];
		if (!id) return console.log("Couldn't find directory:" + dir);
		delete buf.ids[dir];
		await unlink(__maindir + `json/trees/${id}.json`);
		await writeJSONFile(__maindir + "json/backupFile.json", buf);
		if (argv[3] && argv[3] === "-d") {
			const auth = await initAuth();
			if (auth == null) return;
			setDrive(auth);
			await removeFile(id);
		}
		updateLogs(actions.BACKUP_DELETE, { comment: ` of directory: ${dir}` });
	} catch (err) {
		let error: any = err;
		let errAction = error?.syscall
			? error.syscall === "open"
				? actions.READ_LOC_FILE
				: actions.WRITE_LOC_FILE
			: actions.FOLDER_DELETION;
		resultHandler(errAction, { err });
	}
})();
