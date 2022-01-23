import {getRotateMat2} from './matrices';
import {vec2, Vec2, vec3, Vec3, vecDiff, vecSum} from './vector';

export const area = (a: Vec2, b: Vec2) => Math.abs(a.x * b.y - a.y * b.x);

export const distanceBetweenPointAndLine = (
	point: Vec2,
	l1: Vec2,
	l2: Vec2
) => {
	const ab = vecDiff(l2, l1);
	const ac = vecDiff(point, l1);
	const s = area(ab, ac);
	return s * 2 / ab.amplitude();
};
export const rotatePoint = (point: Vec2, angle: number, origin: Vec2 = vec2(0, 0)) => {
	const movedPoint = vecDiff(point, origin);
	const rotated = movedPoint.times(getRotateMat2(angle));
	return vecDiff(origin, rotated);
};

//|a|*|b|*cos(a^b)
export const dotProduct = (a: Vec2, b: Vec2) => {
	return a.x * b.x + a.y * b.y;
};

//|a|*|b|*sin(a^b)
export function crossProduct(a: Vec3, b: Vec3): Vec3 {
	return vec3(
		a.y * b.z - a.z * b.y,
		a.z * b.x - a.x * b.z,
		a.x * b.y - a.y * b.x,
	);
}

export const degreesToRadians = (deg: number) => deg * (Math.PI / 180);

export function isPointInConvexShape(
	point: Vec2,
	shape: Vec2[]
) {
	const sign = Math.sign(crossProduct(
		vecDiff(point, shape[shape.length - 1]).xyz,
		vecDiff(shape[0], shape[shape.length - 1]).xyz
	).z);
	for (let i = 1; i < shape.length; i++) {
		const vec = vecDiff(shape[i], shape[i - 1]).xyz;
		const s = vecDiff(point, shape[i - 1]).xyz;
		const c = crossProduct(s, vec);
		if (Math.sign(c[2]) !== sign) return false;
	}
	return true;
}

export function center(points: Vec2[]): Vec2 {
	return points.reduce(vecSum, vec2()).divide(points.length);
}
