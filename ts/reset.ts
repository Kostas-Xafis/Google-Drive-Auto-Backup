// THIS FILE IS NOT PART OF THE PROJECT.

import { unlink } from "fs/promises";
import { argv } from "process";
import { BackupFile, __maindir } from "./globals";
import { initAuth } from "./utils/auth";
import { removeFile, setDrive } from "./utils/driveQueries";
import { readJSONFile, writeJSONFile } from "./utils/handleJSON";

(async () => {
	const buf: BackupFile = await readJSONFile(__maindir + "json/backupFile.json");
	const id = buf.id[argv[2]];
	if (!id) return console.log("Couldn't find directory:" + argv[2]);
	delete buf.id[argv[2]];
	await unlink(__maindir + `json/trees/${id}.json`);
	await writeJSONFile(__maindir + "json/backupFile.json", buf);
	if (argv[3] && argv[3] === "-d") {
		const auth = await initAuth();
		if (auth == null) return;
		setDrive(auth);
		await removeFile(id);
	}
})();
