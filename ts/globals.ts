import { resolve } from "path";

export type Nullable<T> = T | null | undefined;

export type BackupFile = {
	excludePatterns: string[];
	id: { [k: string]: string };
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
