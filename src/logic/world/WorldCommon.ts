import {FieldNode} from '../field/FieldNode';
import {Bimap} from '../../render/utils/Bimap';
import {Character} from '../Character';
import {error} from '../../render/utils/Errors';
import {CharacterCalmState, CharacterMovingState, CharacterState} from './CharacterState';

export type CharacterMotion = {
	startedAt: number;
	path: string[];
}

export abstract class WorldCommon {

	protected abstract readonly graph: Array<FieldNode>;
	protected readonly nodeIdToNode = new Map<string, FieldNode>();
	protected abstract readonly characters: Bimap<Character, FieldNode>;
	protected abstract readonly charactersMotions: Map<Character, CharacterMotion>;

	initNodes() {
		this.graph.forEach(n => this.nodeIdToNode.set(n.id, n));
	}

	getNodeById(id: string) {
		return this.nodeIdToNode.get(id) || error('No node with id=' + id + ' found');
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

	getCharacterState(character: Character): CharacterState {
		const motion = this.charactersMotions.get(character);
		if (motion) {
			const time = new Date().getTime();
			const diff = time - motion.startedAt;
			const path = motion.path;
			if (diff < (path.length - 1) * character.moveTime) {
				const step = Math.floor(diff / character.moveTime);
				const phase = (diff - step * character.moveTime) / character.moveTime;
				return new CharacterMovingState(
					this.getNodeById(path[step]),
					this.getNodeById(path[step + 1]),
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


	getCharacters(): Character[] {
		return this.characters.map(c => c);
	}

	getNodes(): FieldNode[] {
		return this.graph;
	}

}
