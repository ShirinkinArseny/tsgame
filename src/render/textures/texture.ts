import {Destroyable} from '../utils/destroyable';

export abstract class Texture implements Destroyable {

	protected constructor(public readonly targetTexture: WebGLTexture) {
	}

	abstract destroy(): void;

}
