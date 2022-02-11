import {range} from './lists';

export class Size {
}

export class D1 extends Size {
}

export class D2 extends Size {
}

export class D3 extends Size {
}

export class D4 extends Size {
}

export abstract class Vector<SELF extends Vector<SELF, SIZE>, SIZE extends Size> extends Array<number> {

	public get x() {
		return this[0] || 0;
	}

	public get y() {
		return this[1] || 0;
	}

	public get z() {
		return this[2] || 0;
	}

	public get w() {
		return this[3] || 0;
	}

	public get xy() {
		return vec2(
			this.x,
			this.y
		);
	}

	public get xyz() {
		return vec3(
			this.x,
			this.y,
			this.z
		);
	}

	public get xyzw() {
		return vec4(
			this.x,
			this.y,
			this.z,
			this.w
		);
	}

	amplitude(): number {
		return vecNorma(this as unknown as SELF);
	}

	times<ARG extends number | M,
		M extends Matrix<M, SIZE>,
		>(v: ARG): SELF {
		if (typeof v === 'number') {
			return vecTimes(this as unknown as SELF, v);
		}
		return multiplyMatToVec(
			v as M,
			this as unknown as SELF
		);
	}

	divide(v: number): SELF {
		return vecDivide(this as unknown as SELF, v);
	}

	negate(): SELF {
		return vecNegate(this as unknown as SELF);
	}

	round(): SELF {
		return vecRound(this as unknown as SELF);
	}

}

export class Vec1 extends Vector<Vec1, D1> {

	d1: unknown;

	public static create(x: number = 0): Vec1 {
		return new Vec1(x);
	}

}

export class Vec2 extends Vector<Vec2, D2> {

	d2: unknown;

	public static create(x: number = 0, y: number = 0): Vec2 {
		return new Vec2(x, y);
	}

}

export class Vec3 extends Vector<Vec3, D3> {

	d3: unknown;

	public static create(x: number = 0, y: number = 0, z: number = 0): Vec3 {
		return new Vec3(x, y, z);
	}

}

export class Vec4 extends Vector<Vec4, D4> {

	d4: unknown;

	public static create(x: number = 0, y: number = 0, z: number = 0, w: number = 0): Vec4 {
		return new Vec4(x, y, z, w);
	}

}

export const vec1 = Vec1.create;
export const vec2 = Vec2.create;
export const vec3 = Vec3.create;
export const vec4 = Vec4.create;

function vecChangedComponents<T extends Vector<T, D>, D extends Size>(vector: T, newComponent: (index: number) => number): T {
	const clazz = vector.constructor as any;
	return clazz.create(...range(0, vector.length - 1).map(i => newComponent(i)));
}


export function vecRound<T extends Vector<T, D>, D extends Size>(a: T): T {
	return vecChangedComponents(a, (idx) => Math.round(a[idx]));
}


export function vecNegate<T extends Vector<T, D>, D extends Size>(a: T): T {
	return vecChangedComponents(a, (idx) => -a[idx]);
}

export function vecSum<T extends Vector<T, D>, D extends Size>(a: T, b: T): T {
	return vecChangedComponents(a, (idx) => a[idx] + b[idx]);
}

export function vecDiff<T extends Vector<T, D>, D extends Size>(a: T, b: T): T {
	return vecSum(a, vecNegate(b));
}

export function vecTimes<T extends Vector<T, D>, D extends Size>(a: T, b: number): T {
	return vecChangedComponents(a, (idx) => a[idx] * b);
}

export function vecDivide<T extends Vector<T, D>, D extends Size>(a: T, b: number): T {
	return vecTimes(a, 1 / b);
}

export function vecNorma<T extends Vector<T, D>, D extends Size>(v: T) {
	return Math.sqrt(v.map(v => v * v).reduce((a, b) => a + b));
}

export function vecNormalized<T extends Vector<T, D>, D extends Size>(v: T) {
	const l = vecNorma(v);
	return vecDivide(v, l);
}

export function multiplyMatToVec<V extends Vector<V, D>,
	M extends Matrix<M, D>,
	D extends Size>(matrix: M, vector: V) {
	return vecChangedComponents(
		vector,
		row => range(0, vector.length - 1)
			.map(column => matrix[column * vector.length + row] * vector[column])
			.reduce((a, b) => a + b, 0)
	);
}

export abstract class Matrix<SELF extends Matrix<SELF, SIZE>,
	SIZE extends Size> extends Array<number> {

}

export class Mat1 extends Matrix<Mat1, D1> {

	d1: unknown;

	public static create(_0: number = 0): Mat1 {
		return new Mat1(_0);
	}

}

export class Mat2 extends Matrix<Mat2, D2> {

	d2: unknown;

	public static create(
		_00: number = 0,
		_01: number = 0,
		_10: number = 0,
		_11: number = 0,
	): Mat2 {
		return new Mat2(_00, _01, _10, _11);
	}

}


export class Mat3 extends Matrix<Mat3, D3> {

	d3: unknown;

	public static create(
		_00: number = 0,
		_01: number = 0,
		_02: number = 0,
		_10: number = 0,
		_11: number = 0,
		_12: number = 0,
		_20: number = 0,
		_21: number = 0,
		_22: number = 0
	): Mat3 {
		return new Mat3(_00, _01, _02, _10, _11, _12, _20, _21, _22);
	}

}

export class Mat4 extends Matrix<Mat4, D4> {

	d4: unknown;

	public static create(
		_00: number = 0,
		_01: number = 0,
		_02: number = 0,
		_03: number = 0,
		_10: number = 0,
		_11: number = 0,
		_12: number = 0,
		_13: number = 0,
		_20: number = 0,
		_21: number = 0,
		_22: number = 0,
		_23: number = 0,
		_30: number = 0,
		_31: number = 0,
		_32: number = 0,
		_33: number = 0,
	): Mat4 {
		return new Mat4(_00, _01, _02, _03, _10, _11, _12, _13, _20, _21, _22, _23, _30, _31, _32, _33);
	}

}

export const mat1 = Mat1.create;
export const mat2 = Mat2.create;
export const mat3 = Mat3.create;
export const mat4 = Mat4.create;
