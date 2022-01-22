import {getGraph} from './field/fiveField';
import {FieldNode} from './field/fieldNode';
import {Character} from './character';
import {Bimap} from '../render/utils/bimap';


class AbstractCharacterState {

	constructor(public readonly node: FieldNode) {
	}

}

export class CharacterCalmState extends AbstractCharacterState {

	public readonly kind = 'CharacterCalmState';

	constructor(node: FieldNode) {
		super(node);
	}

}

export class CharacterMovingState extends AbstractCharacterState {

	public readonly kind = 'CharacterMovingState';

	constructor(public readonly from: FieldNode, public readonly to: FieldNode, public readonly phase: number) {
		super(from);
	}

}

export type CharacterState = CharacterCalmState | CharacterMovingState;

class CharacterMotion {
	constructor(
		public readonly startedAt: number,
		public readonly path: FieldNode[]
	) {
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
		this.characters.set(
			new Character(
				'<-XxX-[PRO.DeaШoN]-XxX->',
				'main',
				5,
				5,
				400
			),
			this.graph[20]
		);
		this.characters.set(
			new Character(
				'Вася',
				'main',
				5,
				5,
				400
			),
			this.graph[63]
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
		const from = this.characters.getB(character);
		if (!from) return;
		const path = this.findPath(from, to);
		const date = new Date().getTime();
		this.charactersMotions.set(character, new CharacterMotion(
			date, path
		));
	}

	getCharacterState(character: Character): CharacterState {
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
		const field = this.characters.getB(character);
		if (!field) {
			throw new Error('It is weird, but seems like character is not belong to this world');
		}
		return new CharacterCalmState(field);
	}

	getCharacterAt(node: FieldNode | undefined): Character | undefined {
		if (!node) return undefined;
		return this.characters.getA(node);
	}
}
