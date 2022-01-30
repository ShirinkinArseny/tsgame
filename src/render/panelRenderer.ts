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
		texturedShader.setTexture('texture', this.textureMap.texture);
		texturedShader.setModel('vertexPosition', defaultRect);

		texturedShader.setModel('texturePosition', this.textureMap.getRect('A'));
		texturedShader.draw(vec2(-fw / 2, fh / 2 - 64), vec2(96, 64));

		texturedShader.setModel('texturePosition', this.textureMap.getRect('B'));
		texturedShader.draw(vec2(-fw / 2 + 96, fh / 2 - 64), vec2(8, 64));

		texturedShader.setModel('texturePosition', this.textureMap.getRect('C'));
		texturedShader.draw(vec2(-fw / 2 + 96 + 8, fh / 2 - 64), vec2(400, 64));

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
