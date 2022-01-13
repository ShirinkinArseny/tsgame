import {SimpleCache} from '../utils/cache';
import {Mat4, Vec3, Vec4} from '../matrices';
import {Destroyable} from '../utils/destroyable';
import {Loadable} from '../utils/loadable';

let bindedShader: Shader | undefined;

export class Shader implements Destroyable, Loadable {

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

	private readonly vertexPromise: Promise<string>;
	private readonly fragmentPromise: Promise<string>;
	private vertexShader: WebGLShader;
	private fragmentShader: WebGLShader;
	private program: WebGLProgram;
	private attributesCache: SimpleCache<number>;
	private uniformsCache: SimpleCache<WebGLUniformLocation>;
	private gl: WebGLRenderingContext;

	constructor(
		gl: WebGLRenderingContext,
		vertex: Promise<string>,
		fragment: Promise<string>,
	) {
		this.gl = gl;
		this.vertexPromise = vertex;
		this.fragmentPromise = fragment;
	}

	load(): Promise<void> {
		return Promise.all([
			this.vertexPromise,
			this.fragmentPromise
		]).then(([vertexSource, fragmentSource]) => {
			this.vertexShader = this.loadShader(
				this.gl.VERTEX_SHADER,
				vertexSource,
			);
			this.fragmentShader = this.loadShader(
				this.gl.FRAGMENT_SHADER,
				fragmentSource,
			);

			this.program = this.gl.createProgram();
			this.gl.attachShader(this.program, this.vertexShader);
			this.gl.attachShader(this.program, this.fragmentShader);
			this.gl.linkProgram(this.program);
			if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
				throw new Error(
					'Unable to initialize the shader program: ' +
					this.gl.getProgramInfoLog(this.program),
				);
			}

			this.attributesCache = new SimpleCache((name) =>
				this.gl.getAttribLocation(this.program, name),
			);
			this.uniformsCache = new SimpleCache((name) =>
				this.gl.getUniformLocation(this.program, name),
			);
		});
	}

	destroy() {
		this.gl.deleteProgram(this.program);
		this.gl.deleteShader(this.vertexShader);
		this.gl.deleteShader(this.fragmentShader);
	}

	getAttribute(name: string): number {
		return this.attributesCache.get(name);
	}

	useProgram() {
		this.gl.useProgram(this.program);
		bindedShader = this;
	}

	private requireBinded() {
		if (bindedShader !== this) {
			throw new Error('Trying to use shader while it is not binded');
		}
	}

	setMatrix(
		name: string,
		value: Mat4,
	) {
		this.requireBinded();
		this.gl.uniformMatrix4fv(
			this.uniformsCache.get(name),
			false,
			value,
		);
	}

	setVector4f(name: string, value: Vec4) {
		this.requireBinded();
		this.gl.uniform4fv(this.uniformsCache.get(name), value);
	}

	setVector3f(name: string, value: Vec3) {
		this.requireBinded();
		this.gl.uniform3fv(this.uniformsCache.get(name), value);
	}

	set1i(name: string, value: number) {
		this.requireBinded();
		this.gl.uniform1i(this.uniformsCache.get(name), value);
	}

	set1f(name: string, value: number) {
		this.requireBinded();
		this.gl.uniform1f(this.uniformsCache.get(name), value);
	}

}
