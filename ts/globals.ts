import { resolve } from "path";

export type Nullable<T> = T | null | undefined;

export const updateFrequency = {
	daily: 86400,
	weekly: 86400 * 7,
	biweekly: 86400 * 14,
	monthly: 86400 * 30
};
export type UpdateFrequency = "daily" | "weekly" | "biweekly" | "monthly" | number;
export type BackupFile = {
	excludePatterns: { [k: string]: string[] };
	ids: { [k: string]: string };
	update: UpdateFrequency;
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
