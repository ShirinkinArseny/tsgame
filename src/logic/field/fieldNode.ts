import {Vec2} from '../../render/utils/matrices';

export class FieldNode {
	points: Array<Vec2>;
	nodes: FieldNode[];

	constructor(points: Array<Vec2>) {
		this.points = points;
		this.nodes = [];
	}

	linkToNode(node: FieldNode) {
		if (this.nodes.includes(node)) {
			return;
		}
		this.nodes.push(node);
		node.linkToNode(this);
	}
}
