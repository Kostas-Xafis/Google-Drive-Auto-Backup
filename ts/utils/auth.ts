import fs from "fs/promises";
import readline from "readline";
import { actions, resultHandler } from "./logs";
import { google } from "googleapis";
import { Credentials, OAuth2Client } from "google-auth-library";
import { silentConsole, __maindir } from "../globals";
import { promisify } from "util";
import clc from "cli-color";

// If modifying these scopes, delete token.json.
const SCOPES: string[] = ["https://www.googleapis.com/auth/drive"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH: string = __maindir + "json/token.json";
const { clg } = silentConsole;
type LocalCredentials = {
	client_id: string;
	project_id: string;
	token_uri: string;
	auth_provider_x509_cert_url: string;
	client_secret: string;
	redirect_uris: string;
	auth_uri: string;
};

export async function initAuth(): Promise<OAuth2Client | void> {
	let err: any, credentials: any;
	try {
		const { expiry_date } = JSON.parse(await fs.readFile(TOKEN_PATH, { encoding: "utf-8" }));
		if (Date.now() >= expiry_date) await fs.unlink(TOKEN_PATH);
	} catch (e) {}
	try {
		//I want this to run even if the above trycatch catches an error
		credentials = await fs.readFile(__maindir + "json/credentials.json", { encoding: "utf8" });
		// Authorize a client with credentials, then call the Google Drive API.
		return await authorize(JSON.parse(credentials));
	} catch (error) {
		err = error;
	} finally {
		resultHandler(actions.READ_LOC_FILE, { comment: ` for file ${__maindir + "json/credentials.json"}`, err });
		if (err) return console.log("Error: Can't procced without a credentials.json file");
	}
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
async function authorize(credentials: LocalCredentials): Promise<OAuth2Client> {
	const { client_secret, client_id, redirect_uris } = credentials;
	const oAuth2Client: OAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

	// Check if we have previously stored a token.
	try {
		const token: string = await fs.readFile(TOKEN_PATH, { encoding: "utf8" });
		oAuth2Client.setCredentials(JSON.parse(token));
	} catch (err) {
		await getAccessToken(oAuth2Client);
	} finally {
		return oAuth2Client;
	}
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
async function getAccessToken(oAuth2Client: OAuth2Client): Promise<void> {
	try {
		const authUrl = oAuth2Client.generateAuthUrl({
			access_type: "offline",
			scope: SCOPES
		});
		console.log(clc.yellow.underline("Authorize this app by visiting this url:") + clc.greenBright(authUrl));
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		//@ts-ignore
		const question = promisify<string, string>(rl.question).bind(rl);
		const getToken = promisify<string, Credentials>(oAuth2Client.getToken).bind(oAuth2Client);

		const code = await question(clc.yellow("Enter the code from that page here: "));
		rl.close();
		const token = await getToken(code);
		oAuth2Client.setCredentials(token);
		// Store the token to disk for later program executions
		await fs.writeFile(TOKEN_PATH, JSON.stringify(token, null, 2), { encoding: "utf-8" });
		clg(clc.yellow("Token stored to", __maindir + "json/token.json"));
	} catch (err) {
		resultHandler(actions.WRITE_LOC_FILE, { err });
	}
}
