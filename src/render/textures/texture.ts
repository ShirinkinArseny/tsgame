import {Destroyable} from '../utils/destroyable';

export interface Texture extends Destroyable {

	getTargetTexture(): WebGLTexture;

}
