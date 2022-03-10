import path from "path";
import { argv } from "process";
import { generateTree, JSONFromTree } from "./folderTreeStructure/createTreeStructure";
import { FileNode } from "./folderTreeStructure/node";
import { BackupFile, sleep, __maindir } from "./globals";
import { initAuth } from "./utils/auth";
import { createFolder, folderExists, setDrive, uploadFile, uploadFolder } from "./utils/driveQueries";
import { readJSONFile, writeJSONFile } from "./utils/handleJSON";
import clc from "cli-color";

const checkArgs = (): boolean => {
	if (argv.length < 3) {
		console.log("You need to specify you folder's path to backup");
		return false;
	}
	if (!path.isAbsolute(argv[2])) {
		console.log("You need to give the absolute path of your backup");
		return false;
	}
	return true;
};

async function uploadNode(node: FileNode) {
	node.isLeaf ? await uploadFile(node) : await uploadFolder(node);
}

(async function () {
	if (!checkArgs()) return;
	const dir = argv[2];

	try {
		// Authenticate & Connect with the Google Drive API
		const auth = await initAuth();
		if (auth == null) return;
		setDrive(auth);

		// Read local backup file data && mimeTypes
		const backupFile: BackupFile = <BackupFile>Object.assign({}, await readJSONFile(__maindir + "json/backupFile.json"));

		let id = await getBackupId(backupFile, dir);
		await backup(await generateTree(dir, id));
	} catch (err) {
		console.log(err);
		return;
	}
})();

// Check backup folder exists in gdrive
async function getBackupId(backupFile: BackupFile, dir: string) {
	let id = backupFile.id[dir];
	const exists = await folderExists(id);
	if (!exists) {
		console.log(clc.blueBright("Backup folder wasn't found.\nCreating one right now..."));
		id = backupFile.id[dir] = await createFolder({ name: path.basename(dir) });
		await writeJSONFile(__maindir + "json/backupFile.json", backupFile);
	} else console.log(clc.blueBright("Found backup in Google Drive: " + path.basename(dir)));
	return id;
}

async function backup(tree: FileNode) {
	let queue: FileNode[] = [tree];
	let queueSize = 0;
	console.log(clc.greenBright("==========Start Uploading=========="));
	let t = performance.now();
	while (true) {
		if (queueSize === 15) {
			await sleep(50);
			continue;
		}
		const node = queue.shift();
		if (node == null && queueSize !== 0) {
			await sleep(50);
			continue;
		} else if (node == null) break;

		queueSize++;
		uploadNode(node).finally(() => {
			queue.push(...[...node.leafs, ...node.children]);
			queueSize--;
		});
	}
	console.log(clc.greenBright("==========Done Uploading==========="));
	console.log(`It took ${((performance.now() - t) / 1000).toFixed(2)} seconds to upload.`);
	await JSONFromTree(tree);
}
