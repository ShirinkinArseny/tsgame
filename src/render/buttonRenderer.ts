import {Loadable} from './utils/loadable';
import {Destroyable} from './utils/destroyable';
import {HorizontalAlign, FontStyle, ShadowStyle, Text, VerticalAlign} from './fontRenderer';
import {buttonRenderer, defaultRect, fontRenderer, textboxRenderer, texturedShader} from '../sharedResources';
import {TextureMap} from './textureMap';
import {Mat4, vec2, Vec2, vec4, Vec4} from './utils/vector';
import {PointerEvent} from '../events';

interface ButtonContent {
	title: string;
	onClick: () => any;
	tooltip: Text;
}

const buttonHeight = 16;
const spaceBetweenButtons = 1;
const u = 6; // ну это такая штука

export class ButtonRow {

	buttonsCoords: Vec2[] = [];
	hoveredButton: number | undefined = undefined;
	pressedButton: number | undefined = undefined;

	constructor(private readonly buttons: ButtonContent[], private px: number, private py: number) {
		let xx = 0;
		buttons.forEach(b => {
			const w = buttonRenderer.getButtonWidth(b.title);
			const x = xx;
			this.buttonsCoords.push(vec2(x, x + w));
			xx += w + spaceBetweenButtons;
		});
	}

	render() {
		this.buttons.forEach((button, idx) => {
			buttonRenderer.render(
				this.buttonsCoords[idx].x + this.px,
				this.py,
				button.title,
				this.hoveredButton === idx,
				this.pressedButton === idx,
			);
		});
	}

	renderTooltipLayer() {
		if (this.hoveredButton !== undefined) {
			const button = this.buttons[this.hoveredButton];
			if (button.tooltip) {
				const coords = this.buttonsCoords[this.hoveredButton];
				textboxRenderer.renderTextBox(
					this.px + coords.y, this.py, 120, button.tooltip,
					VerticalAlign.BOTTOM,
					HorizontalAlign.LEFT
				);
			}
		}
	}

	update(dt: number, pressedKeyMap: Map<string, boolean>,
		scrToPx: Mat4,
		pointerEvent: PointerEvent
	) {
		const ptr = vec4(pointerEvent.xy.x, pointerEvent.xy.y, 0, 1).times(scrToPx).xy;
		this.hoveredButton = undefined;
		this.pressedButton = undefined;
		this.buttonsCoords.forEach((btn, idx) => {
			if (pointerEvent.cancelled) return;
			if (
				btn.x + this.px <= ptr.x &&
				ptr.x <= btn.y + this.px &&
				this.py <= ptr.y &&
				ptr.y <= this.py + buttonHeight
			) {
				this.hoveredButton = idx;
				if (pointerEvent.isCursorPressed) {
					this.pressedButton = idx;
				}
				if (pointerEvent.isCursorClicked) {
					this.buttons[idx].onClick();
					pointerEvent.cancelled = true;
				}
			}
		});
	}

}


export class ButtonRenderer implements Loadable, Destroyable {

	textureMap: TextureMap = new TextureMap('ui/button/button');

	getButtonWidth(text: string) {
		let w = fontRenderer.getStringWidth(text, FontStyle.BOLD);
		if (w % u !== 0) {
			w += (u - w % u);
		}
		return w + 2 * u;
	}

	render(
		x: number, y: number,
		text: string,
		hovered: boolean,
		pressed: boolean,
	) {

		const w = this.getButtonWidth(text) - 2 * u;

		const [r1, r2, r3] = this.textureMap.getRects(
			hovered
				? (pressed ? 'Pressed' : 'Hovered')
				: 'Idle'
		);

		texturedShader.useProgram();
		texturedShader.setTexture('texture', this.textureMap);
		texturedShader.setModel('vertexPosition', defaultRect);

		texturedShader.setTexturePosition(r1);
		texturedShader.setVec2('textureScale', vec2(1, 1));
		texturedShader.draw(vec2(x, y), vec2(u, buttonHeight));

		texturedShader.setTexturePosition(r2);
		texturedShader.setVec2('textureScale', vec2(w / u, 1));
		texturedShader.draw(vec2(x + u, y), vec2(w, buttonHeight));

		texturedShader.setTexturePosition(r3);
		texturedShader.setVec2('textureScale', vec2(1, 1));
		texturedShader.draw(vec2(x + 6 + w, y), vec2(6, buttonHeight));

		const a = [102, 57, 49, 255].map(r => r / 255) as Vec4;
		const b = [237, 180, 122, 255].map(r => r / 255) as Vec4;
		const c = [255, 240, 200, 255].map(r => r / 255) as Vec4;

		fontRenderer.drawString(
			text,
			x + u + w / 2 + 1,
			y + 2,
			FontStyle.BOLD,
			hovered ? c : b,
			HorizontalAlign.CENTER,
			1,
			ShadowStyle.DIAGONAL,
			a
		);

		return w + u * 2;
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
