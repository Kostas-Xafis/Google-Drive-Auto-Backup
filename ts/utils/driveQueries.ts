import fs from "fs";
import { OAuth2Client } from "google-auth-library";
import { drive_v3, google } from "googleapis";
import path from "path";
import { FileNode } from "../folderTreeStructure/node";
import { silentConsole, MediaType, MimeTypes, Nullable, __maindir } from "../globals";
import { getModificationTimeFromFile } from "./fileModT";
import { readJSONFile } from "./handleJSON";
import { actions, resultHandler } from "./logs";
import clc from "cli-color";

let drive: drive_v3.Drive;
const { clg } = silentConsole;
const mimeTypes: MimeTypes = {};
(async function () {
	Object.assign({}, await readJSONFile(__maindir + "json/mimetypes.json"));
})();

export function setDrive(auth: OAuth2Client) {
	drive = google.drive({ version: "v3", auth });
}

export async function createFolder(folder: drive_v3.Schema$File): Promise<string> {
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
		resultHandler(actions.FOLDER_CREATION, { err });
		return data?.id ? data.id : "";
	}
}

export async function createFile(metadata: drive_v3.Schema$File, file: MediaType): Promise<Nullable<string>> {
	let data: Nullable<drive_v3.Schema$File>;
	let err;
	try {
		data = (await drive.files.create({ requestBody: metadata, media: file, fields: "id" })).data;
	} catch (error) {
		err = error;
	} finally {
		resultHandler(actions.FILE_CREATION, { err });
		return data?.id;
	}
}

export async function folderExists(id: Nullable<string>): Promise<boolean> {
	if (!id) return false;
	let err;
	try {
		await drive.files.get({ fileId: id });
	} catch (error) {
		err = error;
	} finally {
		resultHandler(actions.FOLDER_SEARCH, { err });
		if (err) return false;
		return true;
	}
}

export async function removeFile(id: Nullable<string>): Promise<void> {
	if (!id) return;
	let err;
	try {
		await drive.files.delete({ fileId: id });
	} catch (error) {
		console.log(clc.redBright("An error occured:"), error);
		err = error;
	} finally {
		resultHandler(actions.FOLDER_DELETION, { err });
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
		resultHandler(actions.FOLDER_UPDATE, { err });
	}
}

export async function uploadFile(node: FileNode): Promise<void> {
	const modTime = Math.round(await getModificationTimeFromFile(node.location));
	if (node.modTime != null && modTime <= node.modTime) return;
	if (node.id != null) await removeFile(node.id);
	node.id = await createFile(
		{ name: node.name, parents: [node.parent?.id ? node.parent.id : ""] },
		{ mimeType: mimeTypes[path.extname(node.name)], body: fs.createReadStream(node.location) }
	);
	if (node.id == null) return node.parent?.removeNode(node);

	clg(clc.blueBright("Uploaded file: ") + clc.yellowBright(node.location));
	node.bupTime = Date.now();
	node.modTime = modTime;
}

export async function uploadFolder(node: FileNode): Promise<void> {
	if (await folderExists(node.id)) return;
	if (node?.parent?.id) node.id = await createFolder({ name: node.name, parents: [node.parent.id] });
}

export async function downloadFile(id: Nullable<string>): Promise<Nullable<any>> {
	if (!id) return;
	let err, data;
	try {
		//I can't use the "acknowledgeAbuse: true" query if a file is not flagged as not abusive cause it will throw an error
		data = (await drive.files.get({ fileId: id, alt: "media" })).data;
		if (typeof data === "object") data = JSON.stringify(data, null, 2);
	} catch (error) {
		err = error as any; //Cant'f find a type for drive api errors :(
		if (err?.errors[0]?.reason === "cannotDownloadAbusiveFile") {
			try {
				data = (await drive.files.get({ fileId: id, alt: "media", acknowledgeAbuse: true })).data;
				err = null;
			} catch (error) {
				err = error;
			}
		}
	} finally {
		resultHandler(actions.FILE_DOWNLOAD, { err });
		return data;
	}
}
