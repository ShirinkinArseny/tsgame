import {SimpleCache} from '../utils/cache';
import {Mat4, Vec3, Vec4} from '../utils/matrices';
import {Destroyable} from '../utils/destroyable';
import {Loadable} from '../utils/loadable';
import {Texture} from '../textures/texture';
import {ConvexShape} from '../shapes/convexShape';
import {error} from '../utils/errors';
import {gl} from '../../globalContext';

let bindedShader: Shader | undefined;
let bindedTextures: { [k: string]: number } = {};
let bindedTexturesCounter = 0;

let bindedModelIndicesCount: number = 0;

function getTextureLayer(index: number): GLenum {
	if (index >= 32) {
		throw new Error('Do you really need this much textures?');
	}
	const key = `TEXTURE${index}`;
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return gl[key] as GLenum;
}

function loadShader(type: number, source: string): WebGLShader {
	const shader = gl.createShader(type);
	if (!shader) {
		throw new Error('???');
	}
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

export class Shader implements Destroyable, Loadable {

	private vertexShader!: WebGLShader;
	private fragmentShader!: WebGLShader;
	private program!: WebGLProgram;
	private loaded: boolean = false;
	private attributesCache: SimpleCache<string, number> = new SimpleCache((name) =>
		gl.getAttribLocation(this.program, name),
	);
	private uniformsCache: SimpleCache<string, WebGLUniformLocation> = new SimpleCache((name) => {
		return gl.getUniformLocation(this.program, name) || error('No uniform found for name ' + name);
	});

	constructor(
		private readonly vertexPromise: Promise<string>,
		private readonly fragmentPromise: Promise<string>,
	) {
	}

	load(): Promise<void> {
		return Promise.all([
			this.vertexPromise,
			this.fragmentPromise
		]).then(([vertexSource, fragmentSource]) => {
			this.vertexShader = loadShader(
				gl.VERTEX_SHADER,
				vertexSource,
			);
			this.fragmentShader = loadShader(
				gl.FRAGMENT_SHADER,
				fragmentSource,
			);
			this.program = gl.createProgram() || error('Failed to create program');
			gl.attachShader(this.program, this.vertexShader);
			gl.attachShader(this.program, this.fragmentShader);
			gl.linkProgram(this.program);
			if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
				throw new Error(
					'Unable to initialize the shader program: ' +
					gl.getProgramInfoLog(this.program),
				);
			}
			this.loaded = true;
		});
	}

	destroy() {
		gl.deleteProgram(this.program);
		gl.deleteShader(this.vertexShader);
		gl.deleteShader(this.fragmentShader);
	}

	getAttribute(name: string): number {
		return this.attributesCache.get(name);
	}

	useProgram() {
		if (!this.loaded) {
			throw new Error('Trying to use shader while it is not loaded yet');
		}
		gl.useProgram(this.program);
		bindedShader = this;
		bindedTextures = {};
		bindedTexturesCounter = -1;
	}

	private requireBinded() {
		if (bindedShader !== this) {
			throw new Error('Trying to use shader while it is not binded');
		}
	}

	setTexture(
		name: string,
		texture: Texture
	) {
		this.requireBinded();
		const idx = bindedTextures[name] || ++bindedTexturesCounter;
		bindedTextures[name] = idx;
		gl.activeTexture(getTextureLayer(idx));
		gl.bindTexture(gl.TEXTURE_2D, texture.getTargetTexture());
		gl.uniform1i(this.uniformsCache.get(name), idx);
	}

	setModel(
		name: string,
		value: ConvexShape,
	) {
		this.requireBinded();
		bindedModelIndicesCount = value.indicesCount;
		value.bindModel(this.attributesCache.get(name));
	}

	setMatrix(
		name: string,
		value: Mat4,
	) {
		this.requireBinded();
		gl.uniformMatrix4fv(
			this.uniformsCache.get(name),
			false,
			value,
		);
	}

	setVector4f(name: string, value: Vec4) {
		this.requireBinded();
		gl.uniform4fv(this.uniformsCache.get(name), value);
	}

	setVector3f(name: string, value: Vec3) {
		this.requireBinded();
		gl.uniform3fv(this.uniformsCache.get(name), value);
	}

	set1i(name: string, value: number) {
		this.requireBinded();
		gl.uniform1i(this.uniformsCache.get(name), value);
	}

	set1f(name: string, value: number) {
		this.requireBinded();
		gl.uniform1f(this.uniformsCache.get(name), value);
	}

	draw() {
		gl.drawElements(
			gl.TRIANGLES,
			bindedModelIndicesCount,
			gl.UNSIGNED_SHORT,
			0,
		);
	}

}
