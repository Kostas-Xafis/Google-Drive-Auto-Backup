import clc from "cli-color";
import fs from "fs/promises";
import path from "path";
import { argv } from "process";
import { treeFromJSON } from "./folderTreeStructure/createTreeStructure";
import { FileNode, JSONVertTree } from "./folderTreeStructure/node";
import { BackupFile, sleep, __maindir } from "./globals";
import { initAuth } from "./utils/auth";
import { downloadFile, folderExists, setDrive } from "./utils/driveQueries";
import { readJSONFile } from "./utils/handleJSON";
import { actions, resultHandler } from "./utils/logs";

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
	return true;
};

const downloadRate: { successful: number; total: number } = { successful: 0, total: 0 };
async function downloadNode(node: FileNode): Promise<void> {
	let fileData;
	try {
		if (!node.isLeaf) {
			await fs.mkdir(node.location, { recursive: true });
		} else {
			downloadRate.total++;
			fileData = await downloadFile(node.id);
			if (fileData == null) return;
			await fs.writeFile(node.location, fileData);
			console.log(clc.blueBright("Downloaded file: ") + clc.greenBright(node.location));
			downloadRate.successful++;
		}
	} catch (err) {
		if (fileData != null) console.log(fileData);
		resultHandler(actions.WRITE_LOC_FILE, err);
		console.log((!node.isLeaf ? "Folder" : "File") + " in " + node.location + " was not stored.");
	}
}

(async function download() {
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
		let id = backupFile.id[src];
		const exists = await folderExists(id);
		if (!exists) {
			console.log(clc.blueBright("Backup folder wasn't found.\n"));
			return;
		}

		const folderTree: FileNode = (await treeFromJSON(id)).tree.changeLocation(dest);
		let queue: FileNode[] = [folderTree];
		let queueSize = 0;
		let t = performance.now();
		while (true) {
			if (queueSize === 20) {
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
			});
		}
		console.log(`It took ${((performance.now() - t) / 1000).toFixed(2)} seconds to download.`);
		console.log(`Downloaded ${downloadRate.successful} out of ${downloadRate.total} files.`);
		if (downloadRate.successful != downloadRate.total)
			console.log(
				"The remaining files for now have to be manually downloaded. If you think there is a bug create an issue the GitHub repo."
			);
	} catch (err) {
		console.log(err);
		return;
	}
})();
