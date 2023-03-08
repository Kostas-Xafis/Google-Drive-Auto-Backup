import fs from "fs";
import { OAuth2Client } from "google-auth-library";
import { drive_v3, google } from "googleapis";
import path from "path";
import { FileNode, NO_MOD_TIME } from "../folderTreeStructure/node";
import { silentConsole, MediaType, MimeTypes, Nullable, __maindir } from "../globals";
import { getModificationTimeFromFile } from "./fileModT";
import { readJSONFile } from "./handleJSON";
import { ACTIONS, resultHandler } from "./logs";
import clc from "cli-color";

let drive: drive_v3.Drive;
const { clg } = silentConsole;
const mimeTypes: MimeTypes = {};
(async function () {
	Object.assign(mimeTypes, await readJSONFile<MimeTypes>(__maindir + "json/mimetypes.json"));
})();

export function setDrive(auth: OAuth2Client) {
	drive = google.drive({ version: "v3", auth });
}

export async function createFolder(folder: drive_v3.Schema$File, dir: string): Promise<string> {
	let data: Nullable<drive_v3.Schema$File>;
	let err;
	try {
		const folderMetadata = {
			...folder,
			mimeType: "application/vnd.google-apps.folder"
		};
		data = (await drive.files.create({ requestBody: folderMetadata, fields: "id" })).data;
	} catch (error) {
		err = error;
	} finally {
		resultHandler(ACTIONS.FOLDER_CREATION, { comment: ` for folder: ${dir}`, err });
		return data?.id ? data.id : "";
	}
}

export async function createFile(metadata: drive_v3.Schema$File, file: MediaType, dir: string): Promise<Nullable<string>> {
	let data: Nullable<drive_v3.Schema$File>;
	let err;
	try {
		data = (await drive.files.create({ requestBody: metadata, media: file, fields: "id" })).data;
	} catch (error) {
		err = error;
	} finally {
		resultHandler(ACTIONS.FILE_CREATION, { comment: ` for file: ${dir}`, err });
		return data?.id;
	}
}

export async function folderExists(id: Nullable<string>, dir: string): Promise<boolean> {
	if (!id) return false;
	let err;
	try {
		await drive.files.get({ fileId: id });
	} catch (error) {
		err = error;
	} finally {
		resultHandler(ACTIONS.FOLDER_SEARCH, { comment: ` for folder: ${dir}`, err });
		if (err) return false;
		return true;
	}
}

export async function removeFile(id: Nullable<string>, dir: string): Promise<void> {
	if (!id) return;
	let err;
	try {
		await drive.files.delete({ fileId: id });
	} catch (error) {
		err = error;
	} finally {
		resultHandler(ACTIONS.FOLDER_DELETION, { comment: ` for file: ${dir}`, err });
	}
}

export async function relocateFile(node: FileNode): Promise<void> {
	if (!node.id) return;
	let err;
	try {
		await drive.files.update({ fileId: node.id, requestBody: { name: node.name } });
	} catch (error) {
		err = error;
	} finally {
		resultHandler(ACTIONS.FOLDER_UPDATE, { comment: ` for folder: ${node.location}`, err });
	}
}

export async function uploadFile(node: FileNode): Promise<void> {
	const modTime = Math.round(await getModificationTimeFromFile(node.location));
	if (node.modTime != NO_MOD_TIME && modTime <= node.modTime) return;
	if (node.id != null) await removeFile(node.id, node.location);
	node.id = await createFile(
		{ name: node.name, parents: [node.parent?.id ? node.parent.id : ""] },
		{ mimeType: mimeTypes[path.extname(node.name)], body: fs.createReadStream(node.location) },
		node.location
	);
	if (node.id == null) return node.parent?.removeNode(node);

	clg(clc.blueBright("Uploaded file: ") + clc.yellowBright(node.location));
	node.bupTime = Date.now();
	node.modTime = modTime;
}

export async function uploadFolder(node: FileNode): Promise<void> {
	if (await folderExists(node.id, node.location)) return;
	if (node?.parent?.id) node.id = await createFolder({ name: node.name, parents: [node.parent.id] }, node.location);
}

export async function downloadFile(id: Nullable<string>, dir: string): Promise<Nullable<any>> {
	if (!id) return;
	let err, data;
	try {
		//I can't use the "acknowledgeAbuse: true" query if a file is not flagged as not abusive cause it will throw an error
		data = (await drive.files.get({ fileId: id, alt: "media" })).data;
		if (typeof data === "object") data = JSON.stringify(data, null, 2);
	} catch (error) {
		err = error as any; //Can't find a type for drive api errors :(
		if (err?.errors[0]?.reason === "cannotDownloadAbusiveFile") {
			try {
				data = (await drive.files.get({ fileId: id, alt: "media", acknowledgeAbuse: true })).data;
				err = null;
			} catch (error) {
				err = error;
			}
		}
	} finally {
		resultHandler(ACTIONS.FILE_DOWNLOAD, { comment: ` for file: ${dir}`, err });
		return data;
	}
}
