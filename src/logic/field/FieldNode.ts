import {center} from '../../render/utils/Geom';
import {vec2, Vec2} from '../../render/utils/Vector';
import {uuid} from '../../render/utils/ID';

export class FieldNode {

	readonly points: Array<Vec2>;
	readonly nodes: FieldNode[];
	center: Vec2;

	constructor(
		points: Array<Vec2>,
		readonly id = uuid()
	) {
		this.points = points;
		this.nodes = [];
		this.center = center(points);
	}

	linkToNode(node: FieldNode) {
		if (this.nodes.includes(node)) {
			return;
		}
		this.nodes.push(node);
		node.linkToNode(this);
	}

	recalcCenter() {
		this.center = center(this.points);
	}

}

export const serializeNodes = (nodes: FieldNode[]) => {
	return nodes.map((node) => ({
		id: node.id,
		points: node.points.map(p => [p.x, p.y]),
		nodes: node.nodes.map(n => n.id)
	}));
};

export const deserializeNodes = (json: any) => {
	const idToNode = Object.fromEntries(
		(json as any[]).map(j =>
			new FieldNode(
				(j.points as number[][]).map(([x, y]) => vec2(x, y)),
				j.id as string
			)
		).map(n => [n.id, n])
	);
	(json as any[]).forEach(n => {
		const id1 = n.id as string;
		const nodes = n.nodes as string[];
		nodes.forEach(id2 => {
			const n1 = idToNode[id1];
			const n2 = idToNode[id2];
			n1.linkToNode(n2);
		});
	});
	return Object.values(idToNode);
};
