import {Vec2} from '../../render/utils/matrices';
import {center} from '../../render/utils/geom';

export class FieldNode {

	readonly points: Array<Vec2>;
	readonly nodes: FieldNode[];
	center: Vec2;

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

	recalcCenter() {
		this.center = center(this.points);
	}

}
