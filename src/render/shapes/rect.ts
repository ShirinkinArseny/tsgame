import {Destroyable} from "../utils/destroyable";

export const drawRect = (gl: WebGLRenderingContext) => {
    gl.drawElements(
        gl.TRIANGLES,
        6,
        gl.UNSIGNED_SHORT,
        0,
    );
}


export class Rect implements Destroyable {

    private readonly gl: WebGLRenderingContext;
    indices: WebGLBuffer;
    position: WebGLBuffer;

    constructor(
        gl: WebGLRenderingContext,
        x0 = 0.0,
        y0 = 0.0,
        x1 = 1.0,
        y1 = 1.0
    ) {
        this.gl = gl;
        const indices = [
            0, 2, 3, 0, 1, 2,
        ];
        const positions = [
            x0, y0,
            x1, y0,
            x1, y1,
            x0, y1,
        ];

        this.position = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(
            positions,
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
            const numComponents = 2;
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
        this.gl.deleteBuffer(this.position)
    }

}
