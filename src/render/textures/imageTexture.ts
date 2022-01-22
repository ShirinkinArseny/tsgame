import {Texture} from './texture';
import {Loadable} from '../utils/loadable';
import {error} from '../utils/errors';
import {gl} from '../../globalContext';

export class ImageTexture implements Texture, Loadable {

	private readonly url: string;
	public width: number = 0;
	public height: number = 0;
	private readonly texture: WebGLTexture;
	private loaded: boolean = false;

	constructor(url: string) {
		this.texture = gl.createTexture() || error('Failed to create texture');
		this.url = '/assets/images/' + url;
	}

	load(): Promise<HTMLImageElement> {
		const level = 0;
		const internalFormat = gl.RGBA;
		const srcFormat = gl.RGBA;
		const srcType = gl.UNSIGNED_BYTE;
		const image = new Image();
		return new Promise((res) => {
			image.onload = () => {
				this.width = image.width;
				this.height = image.height;
				gl.bindTexture(gl.TEXTURE_2D, this.texture);
				gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
					srcFormat, srcType, image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
					gl.NEAREST);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
					gl.NEAREST);
				gl.generateMipmap(gl.TEXTURE_2D);
				this.loaded = true;
				res(image);
			};
			image.src = this.url;
		});
	}

	destroy() {
		gl.deleteTexture(this.getTargetTexture());
	}

	getTargetTexture(): WebGLTexture {
		if (!this.loaded) {
			throw new Error('Trying to use texture before it loaded');
		}
		return this.texture;
	}

}
