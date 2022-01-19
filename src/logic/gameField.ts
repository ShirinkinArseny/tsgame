import {getGraph} from './field/fiveField';
import {FieldNode} from './field/fieldNode';
import {Character} from './character';
import {Bimap} from '../render/utils/bimap';
import {Vec2} from '../render/utils/matrices';
import {Animation} from './animation';
import {center} from '../render/utils/geom';

export class GameField {

	private graph: Array<FieldNode>;
	private characters: Bimap<Character, FieldNode>;
	private charactersMoveAnimations: Map<Character, Animation<Vec2>>;

	constructor() {
		this.graph = getGraph(100, 100, -100, -100, 20);
		this.charactersMoveAnimations = new Map<Character, Animation<Vec2>>();
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
		let moveIsOver = false;
		let step = 0;
		const dur = 600;
		let date = new Date().getTime();
		const anim: Animation<Vec2> = {
			isOver: () => moveIsOver,
			getValue: () => {
				const prev = center(path[step].points);
				const next = center(path[step + 1].points);
				let t = (new Date().getTime() - date) / dur;
				if (t > 1) t = 1;
				return [
					prev[0] * (1 - t) + next[0] * t,
					prev[1] * (1 - t) + next[1] * t,
				] as Vec2;
			}
		};
		this.charactersMoveAnimations.set(character, anim);
		path.forEach((node, index) => {
			setTimeout(() => {
				step = index;
				date = new Date().getTime();
				this.characters.removeA(character);
				this.characters.set(character, node);
				if (index + 1 === path.length) {
					moveIsOver = true;
				}
			}, index * dur);
		});

	}


	getCharacterNode(character: Character) {
		return this.characters.getB(character);
	}

	getCharacterPosition(character: Character) {
		if (!character) return;
		const anim = this.charactersMoveAnimations.get(character);
		if (anim) {
			if (anim.isOver()) {
				this.charactersMoveAnimations.delete(character);
			} else {
				const v = anim.getValue();
				return v;
			}
		}
		const c = this.characters.getB(character);
		return center(c.points);
	}

	getCharacterAt(node: FieldNode) {
		return this.characters.getA(node);
	}
}
