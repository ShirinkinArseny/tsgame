import {Destroyable} from '../utils/destroyable';
import {gl} from '../../globals';

export class ConvexShape implements Destroyable {

	indices: WebGLBuffer;
	position: WebGLBuffer;
	components: number;
	indicesCount: number;

	constructor(
		positions: number[][],
		indices: number[],
	) {
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

	bindModel(
		vertexPositionAttribute: number
	) {
		{
			const numComponents = this.components;
			const type = gl.FLOAT;
			const normalize = false;
			const stride = 0;
			const offset = 0;
			gl.bindBuffer(
				gl.ARRAY_BUFFER,
				this.position,
			);
			gl.vertexAttribPointer(
				vertexPositionAttribute,
				numComponents,
				type,
				normalize,
				stride,
				offset,
			);
			gl.enableVertexAttribArray(vertexPositionAttribute);
		}
		{
			gl.bindBuffer(
				gl.ELEMENT_ARRAY_BUFFER,
				this.indices,
			);
		}
	}

	destroy() {
		gl.deleteBuffer(this.indices);
		gl.deleteBuffer(this.position);
	}

}
