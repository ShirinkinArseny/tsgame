import {TextureMap} from '../textureMap';
import {defaultRect} from '../../sharedResources';
import {LoadableShader} from './loadableShader';
import {vec2, Vec4} from '../utils/vector';

export class TexturedShader extends LoadableShader {

	constructor(url: string = 'textured') {
		super(url);
	}

	override useProgram(
		autoSetScreenSize = true,
		autoSetScale = true
	) {
		super.useProgram(autoSetScreenSize);
		this.setModel('texturePosition', defaultRect);
		this.setModel('vertexPosition', defaultRect);
		if (autoSetScale) {
			this.setVec2('textureScale', vec2(1, 1));
		}
	}

	setTexturePosition(texturePosition: Vec4) {
		this.setVec4('texturePositionFrame', texturePosition);
	}

	setSprite(texture: TextureMap, stateName: string) {
		this.setTexture('texture', texture);
		this.setTexturePosition(texture.getRect(stateName));
	}


}

