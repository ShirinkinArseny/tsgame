import {Frame, TextureMap} from '../TextureMap';
import {defaultRect} from '../../SharedResources';
import {LoadableShader} from './LoadableShader';
import {vec2, Vec4} from '../utils/Vector';

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

	setFrame(frame: Frame) {
		this.setTexture('texture', frame.texture);
		this.setTexturePosition(frame.rect);
	}

	setSprite(texture: TextureMap, stateName: string) {
		this.setFrame(texture.getFrame(stateName));
	}


}

