export class Rect {

    private readonly gl: WebGLRenderingContext;
    indices: WebGLBuffer;
    position: WebGLBuffer;
    indicesCount: number;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        const indices = [
            0, 2, 3, 0, 1, 2,
        ];
        this.indicesCount = indices.length;
        const positions = [
            0.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
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
        vertexPositionAttribute: number,
    ) {
        {
            const numComponents = 3;
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

    draw() {
        this.gl.drawElements(
            this.gl.TRIANGLES,
            this.indicesCount,
            this.gl.UNSIGNED_SHORT,
            0,
        );
    }

}