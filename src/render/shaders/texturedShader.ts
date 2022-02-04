import {TextureMap} from '../textureMap';
import {defaultRect} from '../../sharedResources';
import {LoadableShader} from './loadableShader';

export class TexturedShader extends LoadableShader {

	constructor() {
		super('textured');
	}

	override useProgram(
		autoSetScreenSize: boolean = true
	) {
		super.useProgram(autoSetScreenSize);
		this.setModel('vertexPosition', defaultRect);
	}

	setSprite(texture: TextureMap, stateName: string) {
		this.setTexture('texture', texture);
		this.setModel('texturePosition', texture.getRect(stateName));
	}


}

