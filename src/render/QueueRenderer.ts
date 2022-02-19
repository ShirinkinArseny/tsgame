import {Loadable} from './utils/Loadable';
import {Destroyable} from './utils/Destroyable';
import {TextureMap} from './TextureMap';
import {portraits, texturedShader} from '../SharedResources';
import {vec2} from './utils/Vector';
import {fh} from '../GlobalContext';
import {Character} from '../logic/Character';
import {pointerLayer} from './PointerLayer';

const wLeft = 8;
const wMiddle = 18;
const wRight = 8;
const h = 26;

export class QueueRenderer implements Loadable, Destroyable {


	constructor(
		private onClick: (char: Character) => void,
	) {
	}

	private panelParts = new TextureMap('ui/queue/queue');
	private bar = new TextureMap('ui/bar/bar');
	private team = new TextureMap('ui/team/team');

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
		const diff = 10 * (now - this.lastTime) / 1000;
		this.lastTime = now;
		const change = (value: number, target: number) => {
			const d = (target - value);
			return value + d * diff + Math.sign(d) * diff;
		};

		let width = this.oldWidth || newWidth;
		width = change(width, newWidth);
		this.oldWidth = width;

		texturedShader.setSprite(this.panelParts, 'Left');
		texturedShader.draw(
			vec2(-width / 2, -fh / 2),
			vec2(wLeft, h)
		);

		texturedShader.setVec2('textureScale', vec2((width - wLeft - wRight) / 8, 1.0));
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

			const xx = Math.round(currentX + wMiddle / 2 - 8);
			const yy = Math.round(-fh / 2 + 1 + currentY);

			pointerLayer.listen({
				x: xx,
				y: yy,
				w: 16,
				h: 16,
				on: (e) => {
					if (e.isCursorClicked) {
						e.cancelled = true;
						this.onClick(c);
					}
				}
			});

			texturedShader.setSprite(
				this.team,
				c.team
			);
			texturedShader.draw(
				vec2(xx, yy),
				vec2(16, 16)
			);

			texturedShader.setSprite(portraits, c.type);
			texturedShader.draw(
				vec2(xx, yy),
				vec2(16, 16)
			);

			if (!currentState) {
				const yyy = Math.round(-fh / 2 + 18);
				texturedShader.setSprite(this.bar, 'Black');
				texturedShader.setVec2('textureScale', vec2(8.0, 1.0));
				texturedShader.draw(
					vec2(xx, yyy),
					vec2(16, 1)
				);
				texturedShader.setSprite(this.bar, 'Green');
				const w = Math.max(0, c.hp / c.maxHp);
				texturedShader.setVec2('textureScale', vec2(w * 8, 1.0));
				texturedShader.draw(
					vec2(xx, yyy),
					vec2(w * 16, 1)
				);
				texturedShader.setVec2('textureScale', vec2(1.0, 1.0));
			}

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

		texturedShader.setSprite(this.panelParts, 'Active');
		texturedShader.draw(
			vec2(-width / 2 + wRight + wMiddle / 2 - 4, -fh / 2),
			vec2(wRight, h)
		);


	}

	load(): Promise<any> {
		return Promise.all(
			[
				this.panelParts.load(),
				this.bar.load(),
				this.team.load()
			]
		);
	}

	destroy() {
		this.panelParts.destroy();
		this.bar.destroy();
		this.team.destroy();
	}


}
