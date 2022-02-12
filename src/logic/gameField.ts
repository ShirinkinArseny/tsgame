import {getGraph} from './field/fiveField';
import {FieldNode} from './field/fieldNode';
import {Character} from './character';
import {Bimap} from '../render/utils/bimap';
import {getSkewXmatrix, scale} from '../render/utils/matrices';
import {multiplyMatToVec, vec3} from '../render/utils/vector';
import {TurnQueue} from './TurnQueue';
import {meleeAttack, Spell} from './spell';


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
	turnQueue: TurnQueue;

	constructor() {

		const graph = getGraph(100, 100, -100, -100, 20);
		const skewMatrix = scale(
			getSkewXmatrix(Math.atan2(0.5, 1)),
			vec3(1, 0.7, 1)
		);
		graph.forEach(node => {
			const list = [...node.points];
			node.points.splice(0, node.points.length);
			node.points.push(
				...list.map(point => multiplyMatToVec(skewMatrix, point.xyzw).xy)
			);
			node.recalcCenter();
		});


		this.graph = graph;
		this.charactersMotions = new Map<Character, CharacterMotion>();
		this.characters = new Bimap<Character, FieldNode>();
		this.characters.set(
			new Character(
				'Jeff',
				'spacedude',
				5,
				5,
				400,
				11,
				[meleeAttack]
			),
			this.graph[1]
		);
		this.characters.set(
			new Character(
				'<-XxX-[PRO.DeaШoN]-XxX->',
				'bus',
				5,
				5,
				400,
				0,
				[meleeAttack]
			),
			this.graph[2]
		);
		this.characters.set(
			new Character(
				'Вася',
				'giraffe',
				5,
				5,
				400,
				-4,
				[meleeAttack]
			),
			this.graph[3]
		);

		this.turnQueue = new TurnQueue(this.characters.map((a) => a));
	}

	getCharacters() {
		return this.characters.map((a) => a) as Character[];
	}

	getNodes() {
		return this.graph;
	}

	getCircleArea(
		a: FieldNode,
		radius: number,
		includingCharacterNodes: boolean = false
	): Array<FieldNode> {
		const visitQueue: [FieldNode, number][] = [[a, 0]];
		const visited = new Map<FieldNode, boolean>();
		visited.set(a, true);
		let idx = 0;
		while (idx < visitQueue.length) {
			const [node, length] = visitQueue[idx];
			idx++;
			if (length >= radius) break;
			const neigbors = node.nodes;
			for (const n of neigbors) {
				if (!visited.get(n) && (includingCharacterNodes || !this.characters.getA(n))) {
					visited.set(n, true);
					visitQueue.push([n, length + 1]);
				}
			}
		}
		return visited.keysList();
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

		if (this.turnQueue.getCurrentCharacter() !== character) {
			console.log('not his turn yet');
			return false;
		}
		const from = this.characters.getB(character);
		if (!from) return;
		const path = this.findPath(from, to);
		while (path.length > 0 && path.length - 1 > character.movePoints) {
			path.splice(path.length - 1, 1);
		}
		character.movePoints -= path.length - 1;
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

	startNextTurn() {
		const activeChar = this.turnQueue.getCurrentCharacter();
		activeChar.movePoints = activeChar.movePointsPerTurn;
		this.turnQueue.startNextTurn();
	}

	cast(from: Character, spell: Spell, to: FieldNode) {

	}
}
