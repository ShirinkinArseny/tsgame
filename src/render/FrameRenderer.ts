import {Loadable} from './utils/Loadable';
import {Destroyable} from './utils/Destroyable';
import {defaultRect, texturedShader} from '../SharedResources';
import {TextureMap} from './TextureMap';
import {vec2} from './utils/Vector';

export class FrameRenderer implements Loadable, Destroyable {

	textureMap: TextureMap;

	constructor(textureName: string) {
		this.textureMap = new TextureMap(textureName);
	}

	renderFrame(
		x: number, y: number,
		w: number, h: number
	) {

		const u = 8;

		texturedShader.useProgram(true, false);

		texturedShader.setModel('vertexPosition', defaultRect);


		const draw = (x: number, y: number, name: string, w: number | undefined = undefined, h: number | undefined = undefined) => {
			texturedShader.setFrame(this.textureMap.getFrame(name));
			texturedShader.setVec2('textureScale', vec2((w || u) / u, (h || u) / u));
			texturedShader.draw(
				vec2(x, y),
				vec2(w || u, h || u)
			);
		};

		draw(x + u, y + u, 'M', w, h);

		draw(x, y, 'LT');
		draw(x + u, y, 'T', w, u);
		draw(x + u + w, y, 'RT');

		draw(x, y + u, 'L', u, h);
		draw(x + u + w, y + u, 'R', u, h);

		draw(x, y + u + h, 'LB');
		draw(x + u + w, y + u + h, 'RB');
		draw(x + u, y + u + h, 'B', w, u);

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
