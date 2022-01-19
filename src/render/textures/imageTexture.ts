import {Texture} from './texture';
import {Loadable} from '../utils/loadable';
import {gl} from '../../globals';

export class ImageTexture extends Texture implements Loadable {

	private readonly url: string;
	public width: number;
	public height: number;

	constructor(url: string) {
		super(gl.createTexture());
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
				gl.bindTexture(gl.TEXTURE_2D, this.targetTexture);
				gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
					srcFormat, srcType, image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
					gl.NEAREST);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
					gl.NEAREST);
				gl.generateMipmap(gl.TEXTURE_2D);
				res(image);
			};
			image.src = this.url;
		});
	}

	destroy() {
		gl.deleteTexture(this.targetTexture);
	}

}
