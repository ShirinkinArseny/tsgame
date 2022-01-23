import {ConvexShape} from './convexShape';
import {range} from '../utils/lists';
import {distanceBetweenPointAndLine} from '../utils/geom';
import {vec2, Vec2, vec3, Vec3, vecSum} from '../utils/vector';


export class BorderedShape extends ConvexShape {

	bounds: Vec2[];

	constructor(
		bounds: Vec2[]
	) {
		const center = bounds.reduce(vecSum, vec2()).map(v => v / bounds.length) as Vec2;

		const triangles: Vec3[] = [];

		range(0, bounds.length - 1).forEach(idx => {
			const i1 = idx;
			const i2 = (idx + 1) % bounds.length;
			const b1 = bounds[i1];
			const b2 = bounds[i2];
			triangles.push(
				vec3(...b1, 0),
				vec3(...b2, 0),
				vec3(...center, distanceBetweenPointAndLine(center, b1, b2))
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
