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

	private charIdx = new Map<Character, number>();
	private charState = new Map<Character, string>();
	private charX = new Map<Character, number>();
	private charY = new Map<Character, number>();

	private lastTime = new Date().getTime();

	draw(
		queue: Character[]
	) {
		texturedShader.useProgram();

		const newWidth = wLeft + wRight +
			queue.length * wMiddle
		;

		const now = new Date().getTime();
		const diff = 6 * (now - this.lastTime) / 1000;
		this.lastTime = now;
		const change = (value: number, target: number) => {
			const d = (target - value);
			return value + d * diff + Math.sign(d) * diff;
		};

		let width = this.oldWidth || newWidth;
		width = change(width, newWidth);
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

		const deadChars = new Map(this.charX.keysList().map(char => [char, true]));
		for (let i = 0; i < queue.length; i++) {
			const c = queue[i];

			deadChars.delete(c);

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
				currentX = change(currentX, targetX);
			}

			let currentY = this.charY.get(c) || 0;
			const currentState = this.charState.get(c);
			if (currentState === 'up') {
				currentY = change(currentY, -20);
				if (currentY <= -20) {
					currentX = targetX;
					this.charState.set(c, 'down');
				}
			} else if (currentState === 'down') {
				currentY = change(currentY, 0);
				if (currentY >= 0) {
					this.charState.delete(c);
				}
			}

			this.charX.set(c, currentX);
			this.charY.set(c, currentY);


			texturedShader.setSprite(portraits, c.type);
			texturedShader.draw(
				vec2(
					Math.round(currentX + wMiddle / 2 - 8),
					Math.round(-fh / 2 + 1 + currentY)
				),
				vec2(16, 16)
			);
		}

		deadChars.forEach((_, char) => {
			const x = this.charX.get(char) || 0;
			let y = this.charY.get(char) || 0;
			y = change(y, -20);
			if (y < -20) {
				this.charX.delete(char);
				this.charY.delete(char);
				this.charState.delete(char);
				this.charIdx.delete(char);
			} else {
				this.charY.set(char, y);
				texturedShader.setSprite(portraits, char.type);
				texturedShader.draw(
					vec2(
						Math.round(x + wMiddle / 2 - 8),
						Math.round(-fh / 2 + 1 + y)
					),
					vec2(16, 16)
				);
			}
		});

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
