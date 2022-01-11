import  { SimpleCache } from '../utils/cache';
import  { Mat4, Vec3, Vec4 } from '../matrices';
import {Destroyable} from "../utils/destroyable";

export class Shader implements Destroyable {

    private loadShader(type: number, source: string): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const text = `An error occurred compiling the shader: 
                ${gl.getShaderInfoLog(shader)}`;
            gl.deleteShader(shader);
            throw new Error(text);
        }

        return shader;
    }

    private readonly vertexShader: WebGLShader;
    private readonly fragmentShader: WebGLShader;
    private readonly program: WebGLProgram;
    private readonly attributesCache: SimpleCache<number>;
    private readonly uniformsCache: SimpleCache<WebGLUniformLocation>;

    constructor(
        private readonly gl: WebGLRenderingContext,
        private readonly vertexSource: string,
        private readonly fragmentSource: string,
    ) {
        this.gl = gl;
        this.vertexShader = this.loadShader(
            gl.VERTEX_SHADER,
            vertexSource,
        );
        this.fragmentShader = this.loadShader(
            gl.FRAGMENT_SHADER,
            fragmentSource,
        );

        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vertexShader);
        gl.attachShader(this.program, this.fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error(
                `Unable to initialize the shader program: ` +
                gl.getProgramInfoLog(this.program),
            );
        }

        this.attributesCache = new SimpleCache((name) =>
            this.gl.getAttribLocation(this.program, name),
        );
        this.uniformsCache = new SimpleCache((name) =>
            this.gl.getUniformLocation(this.program, name),
        );
    }

    destroy(gl: WebGLRenderingContext) {
        gl.deleteProgram(this.program);
        gl.deleteShader(this.vertexShader);
        gl.deleteShader(this.fragmentShader);
    }

    getAttribute(name: string): number {
        return this.attributesCache.get(name);
    }

    useProgram() {
        this.gl.useProgram(this.program);
    }

    setMatrix(
        name: string,
        value: Mat4, /* TODO: strict type */
    ) {
        this.gl.uniformMatrix4fv(
            this.uniformsCache.get(name),
            false,
            value,
        );
    }

    setVector4f(name: string, value: Vec4) {
        this.gl.uniform4fv(this.uniformsCache.get(name), value);
    }
    setVector3f(name: string, value: Vec3) {
        this.gl.uniform3fv(this.uniformsCache.get(name), value);
    }
    set1i(name: string, value: number) {
        this.gl.uniform1i(this.uniformsCache.get(name), value);
    }

}
