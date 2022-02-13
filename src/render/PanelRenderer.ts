import {Loadable} from './utils/Loadable';
import {Destroyable} from './utils/Destroyable';
import {TextureMap} from './TextureMap';
import {defaultRect, texturedShader} from '../SharedResources';
import {vec2} from './utils/Vector';
import {fh, fw} from '../GlobalContext';


export class PanelRenderer implements Loadable, Destroyable {

	textureMap: TextureMap = new TextureMap('ui/panel/panel');

	render() {

		texturedShader.useProgram();
		texturedShader.setTexture('texture', this.textureMap);
		texturedShader.setModel('vertexPosition', defaultRect);

		texturedShader.setFrame(this.textureMap.getFrame('A'));
		texturedShader.setVec2('textureScale', vec2(160 / 8, 1));
		texturedShader.draw(vec2(-fw / 2, fh / 2 - 64), vec2(160, 64));

		texturedShader.setFrame(this.textureMap.getFrame('B'));
		texturedShader.setVec2('textureScale', vec2(1, 1));
		texturedShader.draw(vec2(-fw / 2 + 160, fh / 2 - 64), vec2(8, 64));

		texturedShader.setFrame(this.textureMap.getFrame('C'));
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
