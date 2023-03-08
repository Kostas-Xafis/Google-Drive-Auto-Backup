// THIS FILE IS NOT PART OF THE PROJECT.

import { unlink } from "fs/promises";
import { argv } from "process";
import { BackupFile, __maindir } from "./globals";
import { initAuth, removeFile, setDrive, readJSONFile, writeJSONFile, ACTIONS, resultHandler, updateLogs, warnErrors } from "./utils";

(async () => {
	let err, errAction;
	const dir = argv[2];
	try {
		const buf = await readJSONFile<BackupFile>(__maindir + "json/backupFile.json");
		const id = buf.ids[dir];
		if (!id) return console.log("Couldn't find directory:" + dir);
		delete buf.ids[dir];
		await unlink(__maindir + `json/trees/${id}.json`);
		await writeJSONFile(__maindir + "json/backupFile.json", buf);
		if (argv[3] && argv[3] === "-d") {
			const auth = await initAuth();
			if (auth == null) return;
			setDrive(auth);
			await removeFile(id, dir);
		}
		updateLogs(ACTIONS.BACKUP_DELETE, { comment: ` of directory: ${dir}` });
		warnErrors();
	} catch (error) {
		err = error as any;
		errAction = err?.syscall ? (err.syscall === "open" ? ACTIONS.READ_LOC_FILE : ACTIONS.WRITE_LOC_FILE) : ACTIONS.FOLDER_DELETION;
	} finally {
		resultHandler(errAction ? errAction : ACTIONS.BACKUP_DELETE, { comment: ` for backup ${dir}`, err });
	}
})();
