import {Shader} from '../shaders/shader';
import {buildVector, Mat4, normalizeVec3, Vec3, Vec4, vectorProduct} from '../matrices';
import {Destroyable} from "../utils/destroyable";

export class Model implements IModel {
    private readonly gl: WebGLRenderingContext;
    private readonly buffers: ModelBuffers;
    private readonly positions: number[];
    private readonly indices: number[];
    private readonly colors: number[];
    private readonly normales: number[];


    constructor(gl, positions: number[], normales: number[], indices: number[], colors: number[]) {

        this.gl = gl;
        this.indices = indices;
        this.positions = positions.map(a => a * 1.0);
        this.normales = normales.map(a => a * 1.0);
        this.colors = colors.map(a => a * 1.0);

        this.buffers = this.bindBuffers();
    }

    private bindBuffers(): ModelBuffers {

        const position = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, position);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(
            this.positions,
        ), this.gl.STATIC_DRAW);

        const color = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, color);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(
            this.colors,
        ), this.gl.STATIC_DRAW);

        const normales = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normales);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(
            this.normales,
        ), this.gl.STATIC_DRAW);

        const indices = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indices);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(
            this.indices,
        ), this.gl.STATIC_DRAW);

        return {
            position,
            color,
            indices,
            normales,
        };
    }

    draw(viewMatrix, shader: Shader) {
        {
            const numComponents = 3;
            const type = this.gl.FLOAT;
            const normalize = true;
            const stride = 0;
            const offset = 0;
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER,
                this.buffers.normales);
            this.gl.vertexAttribPointer(
                shader.getAttribute('aVertexNorm'),
                numComponents,
                type,
                normalize,
                stride,
                offset,
            );
            this.gl.enableVertexAttribArray(
                shader.getAttribute('aVertexNorm'),
            );
        }
        {
            const numComponents = 3;
            const type = this.gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER,
                this.buffers.position);
            this.gl.vertexAttribPointer(
                shader.getAttribute('aVertexPosition'),
                numComponents,
                type,
                normalize,
                stride,
                offset,
            );
            this.gl.enableVertexAttribArray(
                shader.getAttribute('aVertexPosition'),
            );
        }
        {
            const numComponents = 4;
            const type = this.gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER,
                this.buffers.color);
            this.gl.vertexAttribPointer(
                shader.getAttribute('aVertexColor'),
                numComponents,
                type,
                normalize,
                stride,
                offset,
            );
            this.gl.enableVertexAttribArray(
                shader.getAttribute('aVertexColor'),
            );
        }
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,
            this.buffers.indices);
        shader.setMatrix('uModelMatrix', viewMatrix);
        {
            const type = this.gl.UNSIGNED_SHORT;
            const offset = 0;
            this.gl.drawElements(this.gl.TRIANGLES,
                this.indices.length, type, offset,
            );
        }
    }

    destroy(gl: WebGLRenderingContext) {
        gl.deleteBuffer(this.buffers.position);
        gl.deleteBuffer(this.buffers.color);
        gl.deleteBuffer(this.buffers.indices);
        gl.deleteBuffer(this.buffers.normales);
    }
}

interface ModelBuffers {
    position: WebGLBuffer;
    color: WebGLBuffer;
    indices: WebGLBuffer;
    normales: WebGLBuffer;
}

export interface IModel extends Destroyable {
    draw: (viewMatrix: Mat4, shader: Shader) => void;
}

export class Model2 implements IModel {
    private readonly gl: WebGLRenderingContext;
    private readonly buffers: ModelBuffers;
    private readonly triangles: Triangle[];
    private readonly vertexCount: number;

    constructor(gl: WebGLRenderingContext, triangles: Triangle[], color: Vec4) {
        this.gl = gl;
        this.triangles = triangles;
        const positions = triangles.flat(2);
        const indices = triangles.map((_tr, i) => {
            return [i * 3, i * 3 + 1, i * 3 + 2];
        }).flat();
        const colors = positions.map(() => {
            return color;
        }).flat();
        const normales = this.calcNormales();
        this.buffers = this.bindBuffers(positions, indices, colors, normales);
        this.vertexCount = indices.length;
    }

    calcNormales(): number[] {
        return this.triangles.map(tr => {
            const norms = tr.map(point => {
                return getNormale(tr);
            });
            return norms;
        }).flat(2);
    }

    private bindBuffers(p, i, c, n): ModelBuffers {

        const position = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, position);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(
            p,
        ), this.gl.STATIC_DRAW);

        const color = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, color);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(
            c,
        ), this.gl.STATIC_DRAW);

        const normales = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normales);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(
            n,
        ), this.gl.STATIC_DRAW);

        const indices = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indices);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(
            i,
        ), this.gl.STATIC_DRAW);

        return {
            position,
            color,
            indices,
            normales,
        };
    }

    draw(viewMatrix, shader: Shader) {
        {
            const numComponents = 3;
            const type = this.gl.FLOAT;
            const normalize = true;
            const stride = 0;
            const offset = 0;
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER,
                this.buffers.normales);
            this.gl.vertexAttribPointer(
                shader.getAttribute('aVertexNorm'),
                numComponents,
                type,
                normalize,
                stride,
                offset,
            );
            this.gl.enableVertexAttribArray(
                shader.getAttribute('aVertexNorm'),
            );
        }
        {
            const numComponents = 3;
            const type = this.gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER,
                this.buffers.position);
            this.gl.vertexAttribPointer(
                shader.getAttribute('aVertexPosition'),
                numComponents,
                type,
                normalize,
                stride,
                offset,
            );
            this.gl.enableVertexAttribArray(
                shader.getAttribute('aVertexPosition'),
            );
        }
        {
            const numComponents = 4;
            const type = this.gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER,
                this.buffers.color);
            this.gl.vertexAttribPointer(
                shader.getAttribute('aVertexColor'),
                numComponents,
                type,
                normalize,
                stride,
                offset,
            );
            this.gl.enableVertexAttribArray(
                shader.getAttribute('aVertexColor'),
            );
        }
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,
            this.buffers.indices);
        shader.setMatrix('uModelMatrix', viewMatrix);
        {
            const type = this.gl.UNSIGNED_SHORT;
            const offset = 0;
            this.gl.drawElements(this.gl.TRIANGLES,
                this.vertexCount, type, offset,
            );
        }
    }

    destroy(gl: WebGLRenderingContext) {
        gl.deleteBuffer(this.buffers.position);
        gl.deleteBuffer(this.buffers.color);
        gl.deleteBuffer(this.buffers.indices);
        gl.deleteBuffer(this.buffers.normales);
    }

}

export type Triangle = [Vec3, Vec3, Vec3];

function getNormale(tr: Triangle): Vec3 {
    const vec1 = buildVector(tr[0], tr[1]);
    const vec2 = buildVector(tr[0], tr[2]);
    const normale = vectorProduct(vec1, vec2);
    return normalizeVec3(normale);
}
