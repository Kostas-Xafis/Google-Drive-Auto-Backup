import { resolve } from "path";

export type Nullable<T> = T | null | undefined;

export type BackupFile = {
	excludePatterns: { [k: string]: string[] };
	ids: { [k: string]: string };
};

export type MimeTypes = {
	[k: string]: string;
};

export type MediaType = {
	mimeType?: string;
	body?: any;
};

export const __maindir: string = resolve(__dirname, "../") + "/";

export const sleep = async (ms: number) => await new Promise((rs, rj) => setTimeout(rs, ms));

export const silentConsole = {
	isSilent: false,
	setSilentConsole: () => (silentConsole.isSilent = true),
	clg: (s: string) => (!silentConsole.isSilent ? console.log(s) : null)
};
