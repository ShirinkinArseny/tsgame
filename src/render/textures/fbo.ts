import {Texture} from './texture';
import {error} from '../utils/errors';
import {gl} from '../../globalContext';

export class FBO implements Texture {


	private readonly fb: WebGLFramebuffer;
	private readonly depthBuffer: WebGLRenderbuffer;
	readonly width: number;
	readonly height: number;
	private readonly texture: WebGLTexture;

	constructor(
		width: number,
		height: number
	) {
		this.texture = gl.createTexture() || error('Failed to create texture');
		this.width = width;
		this.height = height;
		gl.bindTexture(gl.TEXTURE_2D, this.getTargetTexture());

		this.depthBuffer = gl.createRenderbuffer() || error('Failed to create renderbuffer');
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

		this.fb = gl.createFramebuffer() || error('Failed to create framebuffer');
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

		const attachmentPoint = gl.COLOR_ATTACHMENT0;
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D,
			this.texture, level,
		);

		gl.renderbufferStorage(gl.RENDERBUFFER,
			gl.DEPTH_COMPONENT16,
			width, height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER,
			gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER,
			this.depthBuffer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	getTargetTexture(): WebGLTexture {
		return this.texture;
	}

	bind() {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
		gl.viewport(0, 0, this.width, this.height);
	}

	unbind() {
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	destroy() {
		gl.deleteTexture(this.texture);
	}

}
