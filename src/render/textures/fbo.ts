import {Texture} from './texture';
import {gl} from '../../globals';

export class FBO extends Texture {


	private readonly fb: WebGLFramebuffer;
	private readonly depthBuffer: WebGLRenderbuffer;
	readonly width: number;
	readonly height: number;

	constructor(
		width: number,
		height: number
	) {
		super(gl.createTexture());
		this.width = width;
		this.height = height;
		gl.bindTexture(gl.TEXTURE_2D, this.targetTexture);

		this.depthBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);

		const level = 0;
		const internalFormat = gl.RGBA;
		const border = 0;
		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;
		const data = null;
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
			width, height, border,
			format, type, data);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
			gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
			gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
			gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
			gl.CLAMP_TO_EDGE);

		this.fb = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

		const attachmentPoint = gl.COLOR_ATTACHMENT0;
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D,
			this.targetTexture, level,
		);

		gl.renderbufferStorage(gl.RENDERBUFFER,
			gl.DEPTH_COMPONENT16,
			width, height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER,
			gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER,
			this.depthBuffer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	bind() {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

		gl.viewport(0, 0, this.width, this.height);

		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT |
			gl.DEPTH_BUFFER_BIT);
	}

	unbind() {
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	destroy() {
		gl.deleteTexture(this.targetTexture);
	}

}
