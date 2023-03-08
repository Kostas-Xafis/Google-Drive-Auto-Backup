import path from "path";
import clc from "cli-color";
import { argv } from "process";
import { generateTree, JSONFromTree } from "./folderTreeStructure/createTreeStructure";
import { FileNode } from "./folderTreeStructure/node";
import { BackupFile, silentConsole, sleep, __maindir } from "./globals";
import {
	initBar,
	updateBar,
	ACTIONS,
	setSilentLogs,
	updateLogs,
	warnErrors,
	readJSONFile,
	writeJSONFile,
	createFolder,
	folderExists,
	setDrive,
	uploadFile,
	uploadFolder,
	initAuth
} from "./utils";
const { clg, setSilentConsole } = silentConsole;
const uploadThroughput = 15;
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
	if (argv[1].includes("backupAll")) return; // Because i export the backup function, the self calling function is created & called
	if (!checkArgs()) return;
	const dir = argv[2];
	try {
		// Authenticate & Connect with the Google Drive API
		const auth = await initAuth();
		if (auth == null) return;
		setDrive(auth);

		// Read local backup file data
		const backupFile = await readJSONFile<BackupFile>(__maindir + "json/backupFile.json");

		let id = await getBackupId(backupFile, dir);
		await backup(await generateTree(dir, id));
		updateLogs(ACTIONS.BACKUP_UPDATE, { comment: ` of directory: ${dir}` });
		warnErrors();
	} catch (err) {
		console.log(err);
		return;
	}
})();

// Check backup folder exists in gdrive
async function getBackupId(backupFile: BackupFile, dir: string) {
	const { ids } = backupFile;
	let id = ids[dir];
	const exists = await folderExists(id, dir);
	if (!exists) {
		clg(clc.blueBright("Backup folder wasn't found.\tCreating one right now..."));
		id = ids[dir] = await createFolder({ name: path.basename(dir) }, dir);
		await writeJSONFile(__maindir + "json/backupFile.json", backupFile);
	} else clg(clc.blueBright("Found backup in Google Drive: " + path.basename(dir)));
	return id;
}

export async function backup(tree: FileNode) {
	if (silentConsole.isSilent) {
		let files = 0;
		tree.traverse(node => node.isLeaf && files++);
		initBar(tree.size, "Uploading: ", files);
	}
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
