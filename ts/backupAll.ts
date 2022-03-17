import { backup } from "./backup";
import { generateTree } from "./folderTreeStructure/createTreeStructure";
import { BackupFile, Nullable, updateFrequency, __maindir } from "./globals";
import { initAuth } from "./utils/auth";
import { folderExists, setDrive } from "./utils/driveQueries";
import { readJSONFile } from "./utils/handleJSON";
import { actions, resultHandler, setSilentLogs, warnErrors } from "./utils/logs";
import { silentConsole } from "./globals";
import clc from "cli-color";
import { updateTimer } from "./utils/updateTimer";
import { readFile } from "fs/promises";
import { argv } from "process";

const { setSilentConsole } = silentConsole;

(async function () {
	const scheduled = argv[2] === "-u" ? false : true;
	setSilentLogs();
	setSilentConsole();
	try {
		// Read local backup file data
		const backupFile = <BackupFile>Object.assign({}, await readJSONFile(__maindir + "json/backupFile.json"));
		const { update } = backupFile;

		if (scheduled) {
			const prevUpdate = await getLastUpdateTime();
			//@ts-ignore
			const updateFreq: number = updateFrequency[update] || Number(update);
			if (!updateFreq)
				console.log(
					"Invalid update frequency: " + update + ". Please make sure that your update field in the backupFile.json is valid"
				);
			if (updateFreq + prevUpdate > Math.floor(Date.now() / 1000)) return; //If the appropriate time hasn't passed
		}
		// Authenticate & Connect with the Google Drive API
		const auth = await initAuth();
		if (auth == null) return;
		setDrive(auth);

		let ids = await getBackupIds(backupFile);

		for (const dir in ids) {
			console.log(clc.cyanBright("Updating: " + dir));
			await backup(await generateTree(dir, ids[dir]));
		}
		updateTimer();
		warnErrors();
	} catch (err) {
		console.log(err);
		return;
	}
})();

async function getLastUpdateTime(): Promise<number> {
	try {
		const logs = await readFile(__maindir + "/logs.log", { encoding: "utf-8" });
		let it = logs.matchAll(new RegExp("FULL BACKUP UPDATE", "g"));
		let index: Nullable<number> = NaN;
		while (true) {
			let next = it.next();
			if (next.done) break;
			index = next.value.index;
		}
		if (!index) return 0;
		return Number(logs.slice(index, index + 43).split(" ")[5]); //The line is 43 characters long and the time is in the 6th word
	} catch (err) {
		console.log("Error: logs.log file was not found");
		resultHandler(actions.READ_LOC_FILE, { err });
		return 0;
	}
}

async function getBackupIds(backup: BackupFile): Promise<{ [k: string]: string }> {
	const { ids } = backup;
	for (const dir in ids) {
		const exists = await folderExists(ids[dir], dir);
		if (!exists) delete ids[dir];
	}
	return ids;
}
