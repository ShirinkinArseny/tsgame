import {ConvexShape} from './convexShape';
import {range} from '../utils/lists';
import {distanceBetweenPointAndLine} from '../utils/geom';
import {Vec2} from '../utils/matrices';


export class BorderedShape extends ConvexShape {

	bounds: [number, number][];

	constructor(
		bounds: [number, number][]
	) {
		const center = bounds.reduce(([ax, ay], [x, y]) => [ax + x, ay + y], [0, 0]).map(v => v / bounds.length) as Vec2;

		type Vertex = [number, number, number];

		const triangles: Vertex[] = [];

		range(0, bounds.length - 1).forEach(idx => {
			const i1 = idx;
			const i2 = (idx + 1) % bounds.length;
			const b1 = bounds[i1];
			const b2 = bounds[i2];
			triangles.push(
				[...b1, 0],
				[...b2, 0],
				[...center, distanceBetweenPointAndLine(center, b1, b2)]
			);
		});
		const indices = range(0, triangles.length - 1);
		super(
			triangles,
			indices
		);
		this.bounds = bounds;
	}


}
