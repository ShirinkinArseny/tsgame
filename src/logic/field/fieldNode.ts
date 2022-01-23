import {center} from '../../render/utils/geom';
import {Vec2} from '../../render/utils/vector';

export class FieldNode {

	readonly points: Array<Vec2>;
	readonly nodes: FieldNode[];
	readonly center: Vec2;

	constructor(points: Array<Vec2>) {
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
}
