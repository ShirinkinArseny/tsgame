import {Loadable} from './utils/Loadable';
import {Destroyable} from './utils/Destroyable';
import {TextureMap} from './TextureMap';
import {frameRenderer, portraits, texturedShader} from '../SharedResources';
import {vec2} from './utils/Vector';
import {fh} from '../GlobalContext';
import {Character} from '../logic/Character';

const wLeft = 8;
const wMiddle = 26;
const wRight = 8;
const h = 26;

export class QueueRenderer implements Loadable, Destroyable {


	panelParts = new TextureMap('ui/queue/queue');

	draw(
		queue: Character[]
	) {
		texturedShader.useProgram();

		const width = wLeft + wRight +
			queue.length * wMiddle
		;

		texturedShader.setVec2('textureScale', vec2(wMiddle / 8, 1.0));
		for (let i = 0; i < queue.length; i++) {
			const xx = -width / 2 + wLeft + i * wMiddle;
			texturedShader.setSprite(this.panelParts, 'Middle');
			texturedShader.draw(
				vec2(xx, -fh / 2),
				vec2(wMiddle, h)
			);
		}
		texturedShader.setVec2('textureScale', vec2(1.0, 1.0));

		texturedShader.setSprite(this.panelParts, 'Right');
		texturedShader.draw(
			vec2(width / 2 - wRight, -fh / 2),
			vec2(wRight, h)
		);

		frameRenderer.renderFrame(
			-width / 2 + 5, -fh / 2 - 10, 16, 20
		);


		for (let i = 0; i < queue.length; i++) {
			const xx = -width / 2 + wLeft + i * wMiddle;
			texturedShader.setSprite(portraits, queue[i].type);
			texturedShader.draw(
				vec2(xx + wMiddle / 2 - 8, -fh / 2 + 1),
				vec2(16, 16)
			);
		}

	}

	load(): Promise<any> {
		return Promise.all(
			[
				this.panelParts.load(),
			]
		);
	}

	destroy() {
		this.panelParts.destroy();
	}


}
