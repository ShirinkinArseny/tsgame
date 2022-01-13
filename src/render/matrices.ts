export type Mat4 = [
	number, number, number, number,
	number, number, number, number,
	number, number, number, number,
	number, number, number, number,
];
export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];


export function identity(): Mat4 {
	return [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
	];
}

export function translate(matrix: Mat4, vector: Vec3) {
	const x = vector[0];
	const y = vector[1];
	const z = vector[2];
	matrix[12] = matrix[0] * x + matrix[4] * y +
		matrix[8] * z + matrix[12];
	matrix[13] = matrix[1] * x + matrix[5] * y +
		matrix[9] * z + matrix[13];
	matrix[14] = matrix[2] * x + matrix[6] * y +
		matrix[10] * z + matrix[14];
	matrix[15] = matrix[3] * x + matrix[7] * y +
		matrix[11] * z + matrix[15];
	return matrix;
}

export function scale(matrix: Mat4, scale: Vec3) {
	const x = scale[0];
	const y = scale[1];
	const z = scale[2];
	matrix[0] *= x;
	matrix[1] *= x;
	matrix[2] *= x;
	matrix[3] *= x;
	matrix[4] *= y;
	matrix[5] *= y;
	matrix[6] *= y;
	matrix[7] *= y;
	matrix[8] *= z;
	matrix[9] *= z;
	matrix[10] *= z;
	matrix[11] *= z;
	return matrix;
}

export function rotate(matrix: Mat4, rad: number, axis: Vec3) {
	let x = axis[0];
	let y = axis[1];
	let z = axis[2];

	const len = 1 / Math.sqrt(x * x + y * y + z * z);

	x *= len;
	y *= len;
	z *= len;

	const s = Math.sin(rad);
	const c = Math.cos(rad);
	const t = 1 - c;

	const a00 = matrix[0];
	const a01 = matrix[1];
	const a02 = matrix[2];
	const a03 = matrix[3];
	const a10 = matrix[4];
	const a11 = matrix[5];
	const a12 = matrix[6];
	const a13 = matrix[7];
	const a20 = matrix[8];
	const a21 = matrix[9];
	const a22 = matrix[10];
	const a23 = matrix[11];

	const b00 = x * x * t + c;
	const b01 = y * x * t + z * s;
	const b02 = z * x * t - y * s;
	const b10 = x * y * t - z * s;
	const b11 = y * y * t + c;
	const b12 = z * y * t + x * s;
	const b20 = x * z * t + y * s;
	const b21 = y * z * t - x * s;
	const b22 = z * z * t + c;

	matrix[0] = a00 * b00 + a10 * b01 + a20 * b02;
	matrix[1] = a01 * b00 + a11 * b01 + a21 * b02;
	matrix[2] = a02 * b00 + a12 * b01 + a22 * b02;
	matrix[3] = a03 * b00 + a13 * b01 + a23 * b02;
	matrix[4] = a00 * b10 + a10 * b11 + a20 * b12;
	matrix[5] = a01 * b10 + a11 * b11 + a21 * b12;
	matrix[6] = a02 * b10 + a12 * b11 + a22 * b12;
	matrix[7] = a03 * b10 + a13 * b11 + a23 * b12;
	matrix[8] = a00 * b20 + a10 * b21 + a20 * b22;
	matrix[9] = a01 * b20 + a11 * b21 + a21 * b22;
	matrix[10] = a02 * b20 + a12 * b21 + a22 * b22;
	matrix[11] = a03 * b20 + a13 * b21 + a23 * b22;
}

export function perspective(fovy: number, aspect: number, near: number, far: number): Mat4 {
	const f = 1.0 / Math.tan(fovy / 2);
	const nf = 1 / (near - far);
	const matrix: Mat4 = [
		f / aspect, 0, 0, 0,
		0, f, 0, 0,
		0, 0, (far + near) * nf, -1,
		0, 0, 2 * far * near * nf, 0,
	];
	return matrix;
}


export function ortho(
	left,
	right,
	bottom,
	top,
	near,
	far,
): Mat4 {
	const lr = 1 / (left - right);
	const bt = 1 / (bottom - top);
	const nf = 1 / (near - far);

	return [
		-2 * lr, 0, 0, 0,
		0, -2 * bt, 0, 0,
		0, 0, 2 * nf, 0,
		(left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1,
	];
}

export function normalizeVec3(vector: Vec3): Vec3 {
	const sumQ = vector[0] * vector[0]
		+ vector[1] * vector[1]
		+ vector[2] * vector[2];
	const rLength = Q_rsqrt(sumQ);

	return [
		vector[0] * rLength,
		vector[1] * rLength,
		vector[2] * rLength,
	];
}

const bytes = new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT);
const floatView = new Float32Array(bytes);
const intView = new Uint32Array(bytes);
const threehalfs = 1.5;

function Q_rsqrt(n: number) {
	const x2 = n * 0.5;
	floatView[0] = n;
	intView[0] = 0x5f3759df - (intView[0] >> 1);
	let y = floatView[0];
	y = y * (threehalfs - (x2 * y * y));

	return y;
}

export function sum(a: Vec3, b: Vec3): Vec3 {
	return [
		a[0] + b[0],
		a[1] + b[1],
		a[2] + b[2],
	];
}

export function vectorProduct(a: Vec3, b: Vec3): Vec3 {
	return [
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0],
	];
}

export function buildVector(from: Vec3, to: Vec3): Vec3 {
	return [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
}
