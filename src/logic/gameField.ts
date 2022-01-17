import {getGraph} from './field/fiveField';
import {FieldNode} from './field/fieldNode';
import {Character} from './character';
import {Bimap} from '../render/utils/bimap';


export class GameField {

	private graph: Array<FieldNode>;
	private characters: Bimap<Character, FieldNode>;

	constructor() {
		this.graph = getGraph(100, 100, -100, -100, 20);
		this.characters = new Bimap<Character, FieldNode>();
		this.characters.set(
			new Character(
				'Mike',
				'main',
				3.5,
				5
			),
			this.graph[0]
		);
		this.characters.set(
			new Character(
				'Jeff',
				'main',
				5,
				5
			),
			this.graph[4]
		);
	}

	getCharacters() {
		return this.characters.map((a, b) => [a, b]) as [Character, FieldNode][];
	}

	getNodes() {
		return this.graph;
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

	moveCharacter(character: Character, to: FieldNode) {

		const path = this.findPath(
			this.characters.getB(character),
			to
		);
		path.forEach((node, index) => {
			setTimeout(() => {
				this.characters.removeA(character);
				this.characters.set(character, node);
			}, index * 200);
		});

	}

	getCharacterPosition(character: Character) {
		return this.characters.getB(character);
	}

	getCharacterAt(node: FieldNode) {
		return this.characters.getA(node);
	}
}
