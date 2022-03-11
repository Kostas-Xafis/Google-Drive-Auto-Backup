import path from "path";
import { argv } from "process";
import { generateTree, JSONFromTree } from "./folderTreeStructure/createTreeStructure";
import { FileNode } from "./folderTreeStructure/node";
import { BackupFile, silentConsole, sleep, __maindir } from "./globals";
import { initAuth } from "./utils/auth";
import { createFolder, folderExists, setDrive, uploadFile, uploadFolder } from "./utils/driveQueries";
import { readJSONFile, writeJSONFile } from "./utils/handleJSON";
import clc from "cli-color";
import { setSilentLogs } from "./utils/logs";
import { initBar, updateBar } from "./utils/progressBar";

const { clg, setSilentConsole } = silentConsole;
const uploadThroughput = 10;
const checkArgs = (): boolean => {
	if (argv.length < 3) {
		console.log("You need to specify your folder's path to backup");
		return false;
	}
	if (!path.isAbsolute(argv[2])) {
		console.log("You need to give the absolute path of your backup");
		return false;
	}
	if (argv.length > 3) {
		for (let i = 3; i < argv.length; i++) {
			if (argv[i] === "-ls") setSilentLogs();
			if (argv[i] === "-s") setSilentConsole();
		}
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
		clg(clc.blueBright("Backup folder wasn't found.\tCreating one right now..."));
		id = backupFile.id[dir] = await createFolder({ name: path.basename(dir) });
		await writeJSONFile(__maindir + "json/backupFile.json", backupFile);
	} else clg(clc.blueBright("Found backup in Google Drive: " + path.basename(dir)));
	return id;
}

async function backup(tree: FileNode) {
	if (silentConsole.isSilent) initBar(tree.size);

	let queue: FileNode[] = [tree];
	let queueSize = 0;
	clg(clc.greenBright("==========Start Uploading=========="));
	let t = performance.now();
	while (true) {
		if (queueSize === uploadThroughput) {
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
			if (silentConsole.isSilent && node.isLeaf) updateBar(node.size);
		});
	}
	clg(clc.greenBright("==========Done Uploading==========="));
	clg(`It took ${((performance.now() - t) / 1000).toFixed(2)} seconds to upload.`);
	await JSONFromTree(tree);
}
