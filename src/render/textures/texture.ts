import {Destroyable} from '../utils/destroyable';

export abstract class Texture implements Destroyable {

	readonly targetTexture: WebGLTexture;

	constructor(targetTexture: WebGLTexture) {
		this.targetTexture = targetTexture;
	}

	abstract destroy();

}
