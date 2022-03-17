import { Nullable, silentConsole } from "../globals";
import { relocateFile, removeFile } from "../utils/driveQueries";
import { FileNode } from "./node";

type Conflicts = {
	remove: FileNode[];
	update: FileNode[][];
};
const conflicts: Conflicts = { remove: [], update: [] };
const relocFreqThreshold = 0.6;
const { clg } = silentConsole;
function searchName(str: string, arr: FileNode[]): Nullable<FileNode> {
	for (const node of arr) if (node.name === str) return node;
	return null;
}

export async function mergeConflicts() {
	await relocationConflicts(); //It will find all the folder relocations and incrementaly add more removes/updates if they come
	updateConflicts();
	await removeConflicts();
}

function checkRelocation(node: FileNode): boolean {
	const fileNameMap: { [k: string]: number } = {};
	fileNameMap.length = 0;
	const nodeLocalLoc = node.location;
	node.traverse(innerNode => {
		if (innerNode.location === node.location) return;
		fileNameMap[innerNode.location.replace(nodeLocalLoc, "")] = 0;
		fileNameMap.length++;
	});
	//Create hash map of all the names of files with the directories starting from the relocated node like "(c:/not included absolute loc)/dir-file"

	//Search all the "new nodes" from the confilcts.update array to see which matches best (if any) with the relocated node
	let highestFreqNode: FileNode[] = [];
	let highestFreq = 0;
	conflicts.update.forEach(([_, node]) => {
		let freq = 0;
		node.traverse(innerNode => {
			//Search if the local location is in the hashmap
			const localLoc = innerNode.location.replace(node.location, "");
			if (localLoc in fileNameMap) freq++;
		});
		freq = freq / fileNameMap.length;
		if (highestFreq < freq) {
			highestFreq = freq;
			highestFreqNode = [_, node];
		}
	});
	if (highestFreq < relocFreqThreshold || highestFreqNode.length < 2) return false; // If the match didn't satisfy the threshold then it won't do the relocation

	const [hfParent, hfNode] = highestFreqNode;

	node.changeLocation(hfNode.location); //Change the dir location to the relocated directory
	node.name = hfNode.name;
	hfParent.appendNode(node); //Add the stored node because transfering all the attributes to the other node is a pain in the ass

	//@ts-ignore
	conflicts.update = conflicts.update.filter(([_, node]) => node.location !== hfNode.location); // remove the highestFreqNode since we "updated" it in a way
	if (highestFreq == 1) return true; //If it's a 100% match then there is no need to search for conflicts

	searchConflicts(node, hfNode); //But we still have to search for any conflicts inside the new "updated/relocated node"
	return true;

	//!This also could apply for large files... but, in that case i should compare SHAs
	//?Right now this only works for directories
}

async function relocationConflicts() {
	const relocNodesArr: FileNode[] = [];
	for (const node of conflicts.remove) {
		const prevLoc = node.location;
		if (!node.isLeaf && checkRelocation(node)) {
			clg("Relocating node:" + prevLoc + " to " + node.location);
			await relocateFile(node);
		} else relocNodesArr.push(node);
	}
	conflicts.remove = relocNodesArr;
}

async function removeConflicts() {
	for (const node of conflicts.remove) {
		node.parent?.removeNode(node);
		clg("Removing: " + node.location);
		await removeFile(node.id, node.location);
	}
}

function updateConflicts() {
	const { update } = conflicts;
	for (const [parent, node] of update) {
		parent.appendNode(node);
	}
}

export function searchConflicts(jNode: FileNode, cNode: FileNode) {
	const searchDirs: FileNode[][] = [];
	//Searches files/dirs that where removed from the current directory, and therefore should be removed
	[...jNode.leafs, ...jNode.children].forEach(node => {
		const matchNode = searchName(node.name, node.isLeaf ? cNode.leafs : cNode.children);
		if (matchNode == null) conflicts.remove.push(node);
		else if (!matchNode.isLeaf) searchDirs.push([node, matchNode]);
	});

	//Searches directories that where added to the current directory, and therefore should be added
	[...cNode.leafs, ...cNode.children].forEach(node => {
		const matchNode = searchName(node.name, node.isLeaf ? jNode.leafs : jNode.children);
		if (matchNode == null) conflicts.update.push([jNode, node]);
	});

	//Search the directories that were found in both jsonTree and the currTree
	searchDirs.forEach(nodes => searchConflicts(nodes[0], nodes[1]));
}
