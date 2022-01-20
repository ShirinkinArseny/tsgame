import {getGraph} from './field/fiveField';
import {FieldNode} from './field/fieldNode';
import {Character} from './character';
import {Bimap} from '../render/utils/bimap';


class AbstractCharacterState {
	readonly node: FieldNode;


	constructor(node: FieldNode) {
		this.node = node;
	}

}

export class CharacterCalmState extends AbstractCharacterState {

	constructor(node: FieldNode) {
		super(node);
	}

}

export class CharacterMovingState extends AbstractCharacterState {
	readonly from: FieldNode;
	readonly to: FieldNode;
	readonly phase: number;

	constructor(from: FieldNode, to: FieldNode, phase: number) {
		super(from);
		this.from = from;
		this.to = to;
		this.phase = phase;
	}

}

export type CharacterState = CharacterCalmState | CharacterMovingState;

class CharacterMotion {
	readonly startedAt: number;
	readonly path: FieldNode[];

	constructor(
		startedAt: number,
		path: FieldNode[]
	) {
		this.startedAt = startedAt;
		this.path = path;
	}

}

export class GameField {

	private readonly graph: Array<FieldNode>;
	private readonly characters: Bimap<Character, FieldNode>;
	private readonly charactersMotions: Map<Character, CharacterMotion>;

	constructor() {
		this.graph = getGraph(100, 100, -100, -100, 20);
		this.charactersMotions = new Map<Character, CharacterMotion>();
		this.characters = new Bimap<Character, FieldNode>();
		this.characters.set(
			new Character(
				'Mike',
				'main',
				3.5,
				5,
				400
			),
			this.graph[0]
		);
		this.characters.set(
			new Character(
				'Jeff',
				'main',
				5,
				5,
				400
			),
			this.graph[4]
		);
	}

	getCharacters() {
		return this.characters.map((a) => a) as Character[];
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
				if (!visited.get(n) && !this.characters.getA(n)) {
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
		const date = new Date().getTime();
		this.charactersMotions.set(character, new CharacterMotion(
			date, path
		));
	}

	getCharacterState(character: Character): CharacterState {
		if (!character) return;
		const motion = this.charactersMotions.get(character);
		if (motion) {
			const time = new Date().getTime();
			const diff = time - motion.startedAt;
			const path = motion.path;
			if (diff >= (path.length - 1) * character.moveTime) {
				this.charactersMotions.delete(character);
				this.characters.removeA(character);
				this.characters.set(character, motion.path[motion.path.length - 1]);
			} else {
				const step = Math.floor(diff / character.moveTime);
				const phase = (diff - step * character.moveTime) / character.moveTime;
				return new CharacterMovingState(
					path[step],
					path[step + 1],
					phase
				);
			}
		}
		return new CharacterCalmState(this.characters.getB(character));
	}

	getCharacterAt(node: FieldNode) {
		return this.characters.getA(node);
	}
}
