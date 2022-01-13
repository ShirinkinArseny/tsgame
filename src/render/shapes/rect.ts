import {ConvexShape} from './convexShape';

export class Rect extends ConvexShape {

	constructor(
		gl: WebGLRenderingContext,
		x0 = 0.0,
		y0 = 0.0,
		x1 = 1.0,
		y1 = 1.0
	) {
		super(gl,
			[
				[x0, y0],
				[x0, y1],
				[x1, y1],
				[x1, y0],
			],
			[0, 1, 2, 0, 2, 3]
		);
	}

}
