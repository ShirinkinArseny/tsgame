import {Loadable} from './utils/loadable';
import {Destroyable} from './utils/destroyable';
import {defaultRect, fontRenderer, texturedShader} from '../sharedResources';
import {TextureMap} from './textureMap';
import {vec2} from './utils/vector';

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

		texturedShader.useProgram();

		texturedShader.setTexture('texture', this.textureMap.texture);
		texturedShader.setModel('vertexPosition', defaultRect);


		const draw = (x: number, y: number, name: string, w: number | undefined = undefined, h: number | undefined = undefined) => {
			texturedShader.setModel('texturePosition', this.textureMap.getRect(name));
			texturedShader.draw(
				vec2(x, y),
				(w && h)
					? vec2(w, h)
					: vec2(u, u)
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
