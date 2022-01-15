import {getRotateMat2, multiplyMatVec, Vec2} from '../matrices';

export const length = (v: Vec2) => {
	return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
};

export const distanceBetweenPoints = (a: Vec2, b: Vec2) => {
	return length(aToB(a, b));
};

export const dotProduct = (a: Vec2, b: Vec2) => {
	return a[0] * b[0] + a[1] * b[1];
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
	const rotated = multiplyMatVec(getRotateMat2(angle), movedPoint) as Vec2;
	return aToB(rotated, origin);
};

export const degreesToRadians = (deg: number) => deg * (Math.PI / 180);