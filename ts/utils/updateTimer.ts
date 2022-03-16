import { argv } from "process";
import { actions, updateLogs } from "./logs";

export function updateTimer() {
	if (argv[2] == "-set") updateLogs(actions.FULL_BACKUP_UPDATE, { comment: ` initial time: ${Math.floor(Date.now() / 1000)}` });
	else updateLogs(actions.FULL_BACKUP_UPDATE, { comment: ` updated time: ${Math.floor(Date.now() / 1000)}` });
}
if (argv[1].includes("setup.bat")) updateTimer();
