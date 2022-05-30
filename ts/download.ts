import clc from "cli-color";
import fs from "fs/promises";
import path from "path";
import { argv } from "process";
import { treeFromJSON } from "./folderTreeStructure/createTreeStructure";
import { FileNode } from "./folderTreeStructure/node";
import { BackupFile, silentConsole, sleep, __maindir } from "./globals";
import {
	readJSONFile,
	initAuth,
	downloadFile,
	folderExists,
	setDrive,
	actions,
	resultHandler,
	setSilentLogs,
	updateLogs,
	warnErrors,
	initBar,
	updateBar
} from "./utils";

const { clg, setSilentConsole } = silentConsole;
const downloadThroughput = 25;
const checkArgs = (): boolean => {
	if (argv.length < 4) {
		console.log("You need to specify the destination for the downloaded files.");
		return false;
	}
	if (argv.length < 3) {
		console.log("You need to specify you backup's path and the destination of the download.");
		return false;
	}
	if (!path.isAbsolute(argv[2])) {
		console.log("You need to give the absolute path of your backup.");
		return false;
	}
	if (argv.length > 4) {
		for (let i = 4; i < argv.length; i++) {
			if (argv[i] === "-ls") setSilentLogs();
			if (argv[i] === "-s") setSilentConsole();
		}
	}
	return true;
};

const downloadRate: { successful: number; total: number } = { successful: 0, total: 0 };
async function downloadNode(node: FileNode): Promise<void> {
	let err, fileData;
	try {
		if (!node.isLeaf) {
			await fs.mkdir(node.location, { recursive: true });
		} else {
			downloadRate.total++;
			fileData = await downloadFile(node.id, node.location);
			if (fileData == null) return;
			await fs.writeFile(node.location, fileData);
			clg(clc.blueBright("Downloaded file: ") + clc.greenBright(node.location));
			downloadRate.successful++;
		}
	} catch (error) {
		err = error;
		clg((!node.isLeaf ? "Folder" : "File") + " in " + node.location + " was not stored.");
	} finally {
		resultHandler(actions.WRITE_LOC_FILE, { comment: ` for file/folder ${node.location}`, err });
	}
}

(async function () {
	if (!checkArgs()) return;
	const src = argv[2];
	const dest = argv[3];
	try {
		// Authenticate & Connect with the Google Drive API
		const auth = await initAuth();
		if (auth == null) return;
		setDrive(auth);

		// Read local backup file data && mimeTypes
		const backupFile: BackupFile = <BackupFile>Object.assign({}, await readJSONFile(__maindir + "json/backupFile.json"));

		// Check backup folder exists in gdrive
		let id = backupFile.ids[src];
		const exists = await folderExists(id, src);
		if (!exists) {
			clg(clc.blueBright("Backup folder wasn't found.\n"));
			return;
		}
		await download(id, dest);
		updateLogs(actions.BACKUP_DOWNLOAD, { comment: ` of directory: ${src}` });
		warnErrors();
	} catch (err) {
		console.log(err);
		return;
	}
})();

async function download(id: string, dest: string) {
	const folderTree: FileNode = (await treeFromJSON(id)).tree.changeLocation(dest);
	if (silentConsole.isSilent) {
		let files = 0;
		folderTree.traverse(node => node.isLeaf && files++);
		initBar(folderTree.size, "Downloading: ", files);
	}
	let queue: FileNode[] = [folderTree];
	let queueSize = 0;
	let t = performance.now();
	while (true) {
		if (queueSize === downloadThroughput) {
			await sleep(50);
			continue;
		}
		const node = queue.shift();
		if (node == null && queueSize !== 0) {
			await sleep(50);
			continue;
		} else if (node == null) break;

		queueSize++;
		downloadNode(node).finally(() => {
			queue.push(...[...node.leafs, ...node.children]);
			queueSize--;
			if (silentConsole.isSilent && node.isLeaf) updateBar(node.size);
		});
	}
	clg(`It took ${((performance.now() - t) / 1000).toFixed(2)} seconds to download.`);
	clg(`Downloaded ${downloadRate.successful} out of ${downloadRate.total} files.`);
	if (downloadRate.successful != downloadRate.total)
		clg("The remaining files for now have to be manually downloaded. If you think there is a bug create an issue the GitHub repo.");
}
