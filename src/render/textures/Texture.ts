import {Destroyable} from '../utils/Destroyable';

export interface Texture extends Destroyable {

	getTargetTexture(): WebGLTexture;

}
