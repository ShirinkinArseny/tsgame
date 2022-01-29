import {Loadable} from './utils/loadable';
import {Destroyable} from './utils/destroyable';
import {HorizontalAlign, FontStyle, ShadowStyle, Text, VerticalAlign} from './fontRenderer';
import {Rect} from './shapes/rect';
import {identity, scale, translate} from './utils/matrices';
import {buttonRenderer, fontRenderer, textboxRenderer, texturedShader} from '../sharedResources';
import {TextureMap} from './textureMap';
import {Mat4, vec2, Vec2, vec3, vec4, Vec4} from './utils/vector';
import {PointerEvent} from '../events';

interface ButtonContent {
	title: string;
	onClick: () => any;
	tooltip: Text;
}

const buttonHeight = 16;

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
			xx += w + 1;
		});
	}

	setPosition(x: number, y: number) {
		this.px = Math.floor(x);
		this.py = Math.floor(y);
	}

	render(pxToScreen: Mat4) {
		this.buttons.forEach((button, idx) => {
			buttonRenderer.render(
				this.buttonsCoords[idx].x + this.px,
				this.py,
				button.title,
				this.hoveredButton === idx,
				this.pressedButton === idx,
				pxToScreen
			);
		});
		if (this.hoveredButton !== undefined) {
			const button = this.buttons[this.hoveredButton];
			if (button.tooltip) {
				const coords = this.buttonsCoords[this.hoveredButton];
				textboxRenderer.renderTextBox(
					this.px + coords.y, this.py, 120, button.tooltip,
					pxToScreen,
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
				}
			}
		});
	}

}


export class ButtonRenderer implements Loadable, Destroyable {

	textureMap: TextureMap = new TextureMap('ui/button/button');

	r: Rect = new Rect(0, 0, 1, buttonHeight);

	getButtonWidth(text: string) {
		return fontRenderer.getStringWidth(text, FontStyle.BOLD) + 12;
	}

	render(
		x: number, y: number,
		text: string,
		hovered: boolean,
		pressed: boolean,
		projMatrix: Mat4
	) {

		const w = fontRenderer.getStringWidth(text, FontStyle.BOLD);

		const [r1, r2, r3] = this.textureMap.getRects(
			hovered
				? (pressed ? 'Pressed' : 'Hovered')
				: 'Idle'
		);

		texturedShader.useProgram();

		texturedShader.setTexture('texture', this.textureMap.texture);
		texturedShader.setMatrix('projectionMatrix', projMatrix);
		texturedShader.setMatrix(
			'modelMatrix',
			scale(translate(identity(), vec3(x, y, 0)), vec3(6, 1, 1)),
		);
		texturedShader.setModel('aVertexPosition', this.r);
		texturedShader.setModel('aTexturePosition', r1);
		texturedShader.draw();

		texturedShader.setMatrix('projectionMatrix', projMatrix);
		texturedShader.setMatrix(
			'modelMatrix',
			scale(translate(identity(), vec3(x + 6, y, 0)), vec3(w, 1, 1)),
		);
		texturedShader.setModel('aVertexPosition', this.r);
		texturedShader.setModel('aTexturePosition', r2);
		texturedShader.draw();

		texturedShader.setMatrix('projectionMatrix', projMatrix);
		texturedShader.setMatrix(
			'modelMatrix',
			scale(translate(identity(), vec3(x + 6 + w, y, 0)), vec3(6, 1, 1)),
		);
		texturedShader.setModel('aVertexPosition', this.r);
		texturedShader.setModel('aTexturePosition', r3);
		texturedShader.draw();

		const a = [102, 57, 49, 255].map(r => r / 255) as Vec4;
		const b = [237, 180, 122, 255].map(r => r / 255) as Vec4;
		const c = [255, 240, 200, 255].map(r => r / 255) as Vec4;

		fontRenderer.drawString(
			text,
			x + 7,
			y + 2,
			FontStyle.BOLD,
			hovered ? c : b,
			projMatrix,
			HorizontalAlign.LEFT,
			1,
			ShadowStyle.DIAGONAL,
			a
		);

		return w + 12;
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
