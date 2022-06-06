import { Nullable } from "../globals";

type nodeConstructor<T> = {
	parent: Nullable<T>; // The parent folder of the file/folder
	children?: Nullable<T[]>; // A list of all folders in a folder
	leafs?: Nullable<T[]>; // A list of all files in a folder
	id?: Nullable<string>; // The Google Drive id of the file/folder once uploaded
	name: string; // The name of the file/folder
	location: string; // The absolute path of the given file/folder
	isLeaf: boolean; // Basically if it's a file or a folder
	bupTime?: Nullable<number>; //The time that the file was backuped
	modTime?: Nullable<number>; //The time that the file was locally modified
	size: number;
};

type FileConstructor = nodeConstructor<FileNode>;
type JSONConstructor = nodeConstructor<number>;

export type JSONVertTree = {
	[k: string]: FileNode;
};

export type StorableJSONTree = {
	nodes: {
		[k: number]: JSONFileNode;
	};
	length: number;
	directories: {
		[k: number]: string;
	};
};

export class FileNode {
	parent: Nullable<FileNode>;
	id: Nullable<string> = null;
	name: string;

	children: FileNode[] = [];
	leafs: FileNode[] = [];

	location: string;
	isLeaf: boolean = false;

	modTime: Nullable<number>;
	bupTime: Nullable<number>;
	size: number;
	constructor(arg: FileConstructor) {
		this.parent = arg.parent;
		this.children = arg?.children ? arg.children : [];
		this.id = arg?.id;
		this.name = arg.name;
		this.location = arg.location;
		this.leafs = arg?.leafs ? arg.leafs : [];
		this.isLeaf = arg.isLeaf;
		this.modTime = arg.modTime;
		this.bupTime = arg.bupTime;
		this.size = arg.size;
	}

	appendNode(node: FileNode): void {
		this.updateSize(node.size);
		if (node.isLeaf) this.leafs.push(node);
		else this.children.push(node);
		node.parent = this;
	}

	removeNode(node: FileNode): void {
		this.updateSize(-node.size);
		if (node.isLeaf) {
			this.leafs = this.leafs.filter(leaf => leaf.location !== node.location);
		} else {
			this.children = this.children.filter(child => child.location !== node.location);
		}
	}

	changeLocation(dir: string): FileNode {
		//Preserve file structure and replace root
		const localLoc = this.location;
		this.traverse(innerNode => {
			innerNode.location = innerNode.location.replace(localLoc, dir);
		});
		return this;
	}

	traverse(cb: (a: FileNode) => void): Promise<void> | void {
		if (cb.constructor.name == "AsyncFunction") {
			return this.#traverse_async(cb);
		} else this.#traverse_norm(cb);
	}

	#traverse_norm(cb: (a: FileNode) => void): void {
		cb(this);
		if (this.isLeaf) return;
		for (const leaf of this.leafs) {
			leaf.#traverse_norm(cb);
		}
		for (const child of this.children) {
			child.#traverse_norm(cb);
		}
	}

	async #traverse_async(cb: (a: FileNode) => void): Promise<void> {
		await cb(this);
		if (this.isLeaf) return;
		for (const leaf of this.leafs) {
			await leaf.#traverse_async(cb);
		}
		for (const child of this.children) {
			await child.#traverse_async(cb);
		}
	}

	addNodesList(tree: JSONVertTree): void {
		tree[this.location] = this;
	}

	generateJSONVertTree(): JSONVertTree {
		const vertTree: JSONVertTree = {};
		this.traverse(node => node.addNodesList(vertTree));
		return vertTree;
	}

	updateSize(size: number) {
		//Size bubbles up
		this.size += size;
		let parent = this.parent;
		while (parent != null) {
			parent.size += size;
			parent = parent.parent;
		}
	}
}

export class JSONFileNode {
	static dir: StorableJSONTree = { directories: {}, length: 0, nodes: {} };
	parent: Nullable<number>;
	id: Nullable<string> = null;
	name: string;

	children: number[] = [];
	leafs: number[] = [];

	location: string;
	isLeaf: boolean = false;

	modTime: Nullable<number>;
	bupTime: Nullable<number>;
	size: number;
	constructor(arg: JSONConstructor) {
		this.parent = arg.parent;
		this.children = arg?.children ? arg.children : [];
		this.id = arg?.id;
		this.name = arg.name;
		this.location = arg.location;
		this.leafs = arg?.leafs ? arg.leafs : [];
		this.isLeaf = arg.isLeaf;
		this.modTime = arg.modTime;
		this.bupTime = arg.bupTime;
		this.size = arg.size;
	}

	private static cb(node: FileNode, parent: number): number {
		const currLen = this.dir.length;
		this.addJSONFileNode(node, parent);
		return currLen;
	}

	static addJSONFileNode(node: FileNode, parent: Nullable<number>): void {
		const { length } = this.dir;
		this.dir.directories[length] = node.location;
		this.dir.length++;
		this.dir.nodes[length] = new this(
			Object.assign({}, node, {
				parent,
				leafs: node.leafs.map((node: FileNode) => this.cb(node, length)),
				children: node.children.map((node: FileNode) => this.cb(node, length))
			})
		);
	}

	static setStorableJSONVertTree(tree: StorableJSONTree): void {
		this.dir = tree;
		for (const n in this.dir.nodes) {
			const node = this.dir.nodes[n];
			this.dir.nodes[n] = new this(node);
		}
	}

	static clearStorableJSONVertTree(): void {
		this.dir = { directories: {}, length: 0, nodes: {} };
	}

	toFileNode(fdir: JSONVertTree): FileNode {
		const { directories, nodes } = JSONFileNode.dir;
		const fNode = new FileNode(
			<FileConstructor>Object.assign({}, this, {
				parent: this.parent != null ? fdir[directories[this.parent]] : null,
				leafs: [],
				children: []
			})
		);
		fNode.addNodesList(fdir);
		// I have to first create the parent and then the children, so i cant do this in the Object.assign above
		fNode.leafs = this.leafs.map((dir: number): FileNode => nodes[dir].toFileNode(fdir));
		fNode.children = this.children.map((dir: number): FileNode => nodes[dir].toFileNode(fdir));
		return fNode;
	}
}
