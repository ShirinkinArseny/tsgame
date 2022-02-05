import {Loadable} from './utils/loadable';
import {Destroyable} from './utils/destroyable';
import {TextureMap} from './textureMap';
import {defaultRect, texturedShader} from '../sharedResources';
import {vec2} from './utils/vector';
import {fh, fw} from '../globalContext';


export class PanelRenderer implements Loadable, Destroyable {

	textureMap: TextureMap = new TextureMap('ui/panel/panel');

	render() {

		texturedShader.useProgram();
		texturedShader.setTexture('texture', this.textureMap);
		texturedShader.setModel('vertexPosition', defaultRect);

		texturedShader.setTexturePosition(this.textureMap.getRect('A'));
		texturedShader.setVec2('textureScale', vec2(160 / 8, 1));
		texturedShader.draw(vec2(-fw / 2, fh / 2 - 64), vec2(160, 64));

		texturedShader.setTexturePosition(this.textureMap.getRect('B'));
		texturedShader.setVec2('textureScale', vec2(1, 1));
		texturedShader.draw(vec2(-fw / 2 + 160, fh / 2 - 64), vec2(8, 64));

		texturedShader.setTexturePosition(this.textureMap.getRect('C'));
		texturedShader.setVec2('textureScale', vec2(400 / 8, 1));
		texturedShader.draw(vec2(-fw / 2 + 160 + 8, fh / 2 - 64), vec2(400, 64));

	}

	load(): Promise<any> {
		return Promise.all(
			[
				this.textureMap.load()
			]
		);
	}

	destroy() {
		this.textureMap.destroy();
	}


}
