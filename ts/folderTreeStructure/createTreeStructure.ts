import { FileNode, JSONFileNode, JSONVertTree, StorableJSONTree } from "./node";
import fs, { Dirent, statSync } from "fs";
import { BackupFile, __maindir } from "../globals";
import { readJSONFile, writeJSONFile } from "../utils/handleJSON";
import { isMatch } from "micromatch";
import { mergeConflicts, searchConflicts } from "./conflicts";
import path from "path";

let excludePatterns: string[];

type CompleteTree = {
	tree: FileNode;
	vertTree: JSONVertTree;
};

const createTree = async (location: string): Promise<FileNode> => {
	const backup = await readJSONFile<BackupFile>(__maindir + "json/backupFile.json");
	excludePatterns = backup.excludePatterns[location] || backup.excludePatterns["*"] || [];
	const root: FileNode = new FileNode({
		id: backup.ids[location],
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
			if (isMatch(location, excludePatterns)) return;
			//Add directories and files to node
			const isLeaf = !entry.isDirectory();
			const size = isLeaf ? statSync(location).size : 0;
			parent.appendNode(new FileNode({ parent, name: entry.name, location, isLeaf, size }));
		});

		parent.children.forEach(child => {
			searchNode(child); //Repeat for children (aka directories)
		});
	}
};

export const treeFromJSON = async (id: string): Promise<CompleteTree> => {
	const storedJsonTree = await readJSONFile<StorableJSONTree>(__maindir + `json/trees/${id}.json`);
	const vertTree = {} as JSONVertTree;
	JSONFileNode.setStorableJSONVertTree(storedJsonTree);
	const tree = new JSONFileNode(storedJsonTree.nodes[0]).toFileNode(vertTree);
	JSONFileNode.clearStorableJSONVertTree();
	return { tree, vertTree };
};

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

export const JSONFromTree = async (tree: FileNode): Promise<void> => {
	await JSONFileNode.addJSONFileNode(tree, null);
	await writeJSONFile(__maindir + `json/trees/${tree.id}.json`, JSONFileNode.dir);
};
