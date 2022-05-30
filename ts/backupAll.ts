import { backup } from "./backup";
import { generateTree } from "./folderTreeStructure/createTreeStructure";
import { BackupFile, __maindir } from "./globals";
import { initAuth, folderExists, setDrive, readJSONFile, actions, setSilentLogs, updateLogs, warnErrors } from "./utils";
import { silentConsole } from "./globals";
import clc from "cli-color";

const { setSilentConsole } = silentConsole;

export const backupAll = async () => {
	setSilentLogs();
	setSilentConsole();
	try {
		// Read local backup file data
		const backupFile = <BackupFile>Object.assign({}, await readJSONFile(__maindir + "json/backupFile.json"));

		// Authenticate & Connect with the Google Drive API
		const auth = await initAuth();
		if (auth == null) return;
		setDrive(auth);

		let ids = await getBackupIds(backupFile);

		for (const dir in ids) {
			console.log(clc.cyanBright("Updating: " + dir));
			await backup(await generateTree(dir, ids[dir]));
		}
		updateLogs(actions.FULL_BACKUP_UPDATE, {});
		warnErrors();
	} catch (err) {
		console.log(err);
		return;
	}
};

async function getBackupIds(backup: BackupFile): Promise<{ [k: string]: string }> {
	const { ids } = backup;
	for (const dir in ids) {
		const exists = await folderExists(ids[dir], dir);
		if (!exists) delete ids[dir];
	}
	return ids;
}
