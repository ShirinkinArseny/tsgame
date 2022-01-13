import {Destroyable} from '../utils/destroyable';

export class ConvexShape implements Destroyable {

	private readonly gl: WebGLRenderingContext;
	indices: WebGLBuffer;
	position: WebGLBuffer;
	components: number;
	indicesCount: number;

	constructor(
		gl: WebGLRenderingContext,
		positions: number[][],
		indices: number[],
	) {
		this.gl = gl;

		const components = positions[0].length;
		for (let i = 1; i < positions.length; i++) {
			if (positions[i].length !== components) {
				throw new Error('All position elements should have same length');
			}
		}
		this.components = components;
		this.indicesCount = indices.length;

		this.position = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.position);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(
			positions.flat(),
		), gl.STATIC_DRAW);
		this.indices = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(
			indices,
		), gl.STATIC_DRAW);
	}

	bind(
		vertexPositionAttribute: number
	) {
		{
			const numComponents = this.components;
			const type = this.gl.FLOAT;
			const normalize = false;
			const stride = 0;
			const offset = 0;
			this.gl.bindBuffer(
				this.gl.ARRAY_BUFFER,
				this.position,
			);
			this.gl.vertexAttribPointer(
				vertexPositionAttribute,
				numComponents,
				type,
				normalize,
				stride,
				offset,
			);
			this.gl.enableVertexAttribArray(vertexPositionAttribute);
		}
		{
			this.gl.bindBuffer(
				this.gl.ELEMENT_ARRAY_BUFFER,
				this.indices,
			);
		}
	}

	destroy() {
		this.gl.deleteBuffer(this.indices);
		this.gl.deleteBuffer(this.position);
	}

}
