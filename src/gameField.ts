import {getGraph} from './render/field/fiveField';
import {FieldNode} from './render/field/fieldNode';


export class GameField {

	graph: Array<FieldNode>;

	constructor() {
		this.graph = getGraph(100, 100, -100, -100, 20);
	}

	findPath(a: FieldNode, b: FieldNode) {

		const visitQueue: FieldNode[] = [a];
		const visited = new Map<FieldNode, FieldNode>();
		visited.set(a, a);
		let found = false;
		let idx = 0;
		while (!found && idx < visitQueue.length) {
			const node = visitQueue[idx];
			idx++;
			const neigbors = node.nodes;
			for (const n of neigbors) {
				if (!visited.get(n)) {
					visited.set(n, node);
					if (n === b) {
						found = true;
					} else {
						visitQueue.push(n);
					}
				}
			}
		}
		const path: FieldNode[] = [];
		const buildPath = (c: FieldNode) => {
			path.push(c);
			const parent = visited.get(c);
			if (parent === c) return;
			if (parent) {
				buildPath(parent);
			}
		};
		buildPath(b);
		return path.reverse();
	}

}
