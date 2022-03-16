import { argv } from "process";
import { backup } from "./backup";
import { generateTree } from "./folderTreeStructure/createTreeStructure";
import { BackupFile, __maindir } from "./globals";
import { initAuth } from "./utils/auth";
import { folderExists, setDrive } from "./utils/driveQueries";
import { readJSONFile } from "./utils/handleJSON";
import { setSilentLogs } from "./utils/logs";
import { silentConsole } from "./globals";
import clc from "cli-color";

function checkArgs(): boolean {
	if (argv.length > 2) {
		for (let i = 2; i < argv.length; i++) {
			if (argv[i] === "-ls") setSilentLogs();
			if (argv[i] === "-s") silentConsole.setSilentConsole();
		}
	}
	return true;
}

(async function () {
	checkArgs();
	try {
		// Authenticate & Connect with the Google Drive API
		const auth = await initAuth();
		if (auth == null) return;
		setDrive(auth);

		// Read local backup file data && mimeTypes
		const backupFile = <BackupFile>Object.assign({}, await readJSONFile(__maindir + "json/backupFile.json"));

		let ids = await getBackupIds(backupFile);
		for (const dir in ids) {
			console.log(clc.cyanBright("Updating: " + dir));
			await backup(await generateTree(dir, ids[dir]));
		}
	} catch (err) {
		console.log(err);
		return;
	}
})();

async function getBackupIds(backup: BackupFile): Promise<{ [k: string]: string }> {
	const { ids } = backup;
	for (const dir in ids) {
		const exists = await folderExists(ids[dir]);
		if (!exists) delete ids[dir];
	}
	return ids;
}
