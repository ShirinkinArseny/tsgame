import {getRotateMat2, multiplyMatToVec, Vec2, Vec3} from './matrices';

export const length = (v: Vec2) => {
	return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
};

export const distanceBetweenPoints = (a: Vec2, b: Vec2) => {
	return length(aToB(a, b));
};

export const aToB: (a: Vec2, b: Vec2) => Vec2 = (a, b) => {
	return [
		b[0] - a[0],
		b[1] - a[1]
	];
};

export const area = (a: Vec2, b: Vec2) => Math.abs(a[0] * b[1] - a[1] * b[0]);

export const distanceBetweenPointAndLine = (
	point: Vec2,
	l1: Vec2,
	l2: Vec2
) => {
	const ab = aToB(l1, l2);
	const ac = aToB(l1, point);
	const s = area(ab, ac);
	return s * 2 / length(ab);
};
export const translatePoint = (point: Vec2, [x = 0, y = 0]) => {
	return [point[0] + x, point[1] + y];
};
export const rotatePoint = (point: Vec2, angle: number, origin: Vec2 = [0, 0]) => {
	const movedPoint = aToB(origin, point);
	const rotated = multiplyMatToVec(getRotateMat2(angle), movedPoint) as Vec2;
	return aToB(rotated, origin);
};


export function normalizeVec3(vector: Vec3): Vec3 {
	const sumQ = vector[0] * vector[0]
		+ vector[1] * vector[1]
		+ vector[2] * vector[2];
	const rLength = 1 / Math.sqrt(sumQ);

	return [
		vector[0] * rLength,
		vector[1] * rLength,
		vector[2] * rLength,
	];
}

//|a|*|b|*cos(a^b)
export const dotProduct = (a: Vec2, b: Vec2) => {
	return a[0] * b[0] + a[1] * b[1];
};

//|a|*|b|*sin(a^b)
export function crossProduct([a0, a1, a2 = 0], [b0, b1, b2 = 0]): Vec3 {
	return [
		a1 * b2 - a2 * b1,
		a2 * b0 - a0 * b2,
		a0 * b1 - a1 * b0,
	];
}

export const degreesToRadians = (deg: number) => deg * (Math.PI / 180);

export function isPointInConvexShape(
	point: Vec2,
	shape: Vec2[]
) {
	const sign = Math.sign(crossProduct(aToB(shape[shape.length - 1], point), aToB(shape[shape.length - 1], shape[0]))[2]);
	for (let i = 1; i < shape.length; i++) {
		const vec = aToB(shape[i-1], shape[i]);
		const s = aToB(shape[i-1], point);
		const c = crossProduct(s, vec);
		if (Math.sign(c[2]) !== sign) return false;
	}
	return true;
}
