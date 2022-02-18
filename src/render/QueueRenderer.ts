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

	private oldWidth: number | undefined = undefined;

	private charIdx = new WeakMap<Character, number>();
	private charState = new WeakMap<Character, string>();
	private charX = new WeakMap<Character, number>();
	private charY = new WeakMap<Character, number>();

	draw(
		queue: Character[]
	) {
		texturedShader.useProgram();

		const newWidth = wLeft + wRight +
			queue.length * wMiddle
		;

		let width = this.oldWidth || newWidth;
		if (width < newWidth) {
			width++;
		} else if (width > newWidth) {
			width--;
		}
		this.oldWidth = width;

		texturedShader.setVec2('textureScale', vec2(width / 8, 1.0));
		texturedShader.setSprite(this.panelParts, 'Middle');
		texturedShader.draw(
			vec2(-width / 2 + wLeft, -fh / 2),
			vec2(width - wLeft - wRight, h)
		);
		texturedShader.setVec2('textureScale', vec2(1.0, 1.0));

		texturedShader.setSprite(this.panelParts, 'Right');
		texturedShader.draw(
			vec2(width / 2 - wRight, -fh / 2),
			vec2(wRight, h)
		);

		for (let i = 0; i < queue.length; i++) {
			const c = queue[i];

			const oldIdx = this.charIdx.get(c) || 0;
			this.charIdx.set(c, i);

			if (oldIdx === 0 && i + 1 === queue.length && queue.length > 1) {
				this.charState.set(c, 'up');
			}

			const targetX = -width / 2 + wLeft + i * wMiddle;
			let oldX = this.charX.get(c);
			if (oldX === undefined) {
				oldX = targetX;
			}
			let currentX = oldX;
			if (!this.charState.get(c)) {
				if (oldX > targetX) {
					currentX--;
				} else if (oldX < targetX) {
					currentX++;
				}
			}

			let currentY = this.charY.get(c) || 0;
			const currentState = this.charState.get(c);
			if (currentState === 'up') {
				currentY--;
				if (currentY < -20) {
					currentX = targetX;
					this.charState.set(c, 'down');
				}
			} else if (currentState === 'down') {
				currentY++;
				if (currentY === 0) {
					this.charState.delete(c);
				}
			}

			this.charX.set(c, currentX);
			this.charY.set(c, currentY);

			texturedShader.setSprite(portraits, c.type);
			texturedShader.draw(
				vec2(currentX + wMiddle / 2 - 8, -fh / 2 + 1 + currentY),
				vec2(16, 16)
			);
		}

		frameRenderer.renderFrame(
			-width / 2 + 5, -fh / 2 - 10, 16, 20
		);


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
