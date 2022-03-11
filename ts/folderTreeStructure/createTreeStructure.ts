import { FileNode, JSONFileNode, JSONVertTree } from "./node";
import fs, { Dirent, statSync } from "fs";
import { BackupFile, __maindir } from "../globals";
import { readJSONFile, writeJSONFile } from "../utils/handleJSON";
import micromatch from "micromatch";
import { mergeConflicts, searchConflicts } from "./conflicts";
import path from "path";

let excludePatterns: string[];

type CompleteTree = {
	tree: FileNode;
	vertTree: JSONVertTree;
};

const createTree = async (location: string): Promise<FileNode> => {
	const backup: BackupFile = await readJSONFile(__maindir + "json/backupFile.json");
	excludePatterns = backup.excludePatterns;
	const root: FileNode = new FileNode({
		id: backup.id[location],
		parent: null,
		name: path.basename(location),
		location,
		isLeaf: false,
		size: 0
	});
	searchNode(root);
	return root;
};

const searchNode = (parent: FileNode): void => {
	const dirContent = fs.readdirSync(parent.location, { encoding: "utf-8", withFileTypes: true });
	if (dirContent.length != 0) {
		dirContent.forEach((entry: Dirent) => {
			const location = parent.location + "/" + entry.name;
			if (micromatch.isMatch(location, excludePatterns)) return;
			//Add directories and files to node
			const isLeaf = !entry.isDirectory();
			const size = isLeaf ? statSync(location).size : 0;
			parent.appendNode(new FileNode({ parent, name: entry.name, location, isLeaf, size }));
			parent.size += size;
		});

		parent.children.forEach(child => {
			searchNode(child); //Repeat for children (aka directories)
			parent.size += child.size;
		});
	}
};

export const treeFromJSON = async (id: string): Promise<CompleteTree> => {
	const storedJsonTree = Object.assign({}, await readJSONFile(__maindir + `json/trees/${id}.json`));
	const vertTree: JSONVertTree = {};
	JSONFileNode.setStorableJSONVertTree(storedJsonTree);
	const tree = new JSONFileNode(storedJsonTree.nodes[0]).toFileNode(vertTree);
	JSONFileNode.clearStorableJSONVertTree();
	return { tree, vertTree };
};

/**
 * If the directory is not backuped then it generates the tree on the fly,
 * else it's going to get the StorableJSONVertTree, convert it to a FileNode tree
 * and then search for conflicts between it and the current file structure.
 * @param dir
 * @returns The root of the updated tree
 */
export const generateTree = async (dir: string, id: string): Promise<FileNode> => {
	try {
		fs.statSync(__maindir + `json/trees/${id}.json`);
		const { tree } = await treeFromJSON(id);
		const currTree = await createTree(dir);
		await searchConflicts(tree, currTree);
		await mergeConflicts();
		return tree;
	} catch (err) {
		return await createTree(dir);
	}
};

/**
 * Converts a given tree of @type {FileNode}
 * to a storable json format and then stores it to the /json/trees folder
 */
export const JSONFromTree = async (tree: FileNode): Promise<void> => {
	await JSONFileNode.addJSONFileNode(tree, null);
	await writeJSONFile(__maindir + `json/trees/${tree.id}.json`, JSONFileNode.dir);
};
