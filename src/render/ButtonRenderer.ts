import {Loadable} from './utils/Loadable';
import {Destroyable} from './utils/Destroyable';
import {HorizontalAlign, FontStyle, ShadowStyle, VerticalAlign, Text} from './FontRenderer';
import {buttonRenderer, defaultRect, fontRenderer, textboxRenderer, texturedShader} from '../SharedResources';
import {TextureMap} from './TextureMap';
import {Mat4, vec2, Vec2, vec4, Vec4} from './utils/Vector';
import {PointerEvent} from '../Events';
import {fw} from '../GlobalContext';

export interface AbstractButtonContent {
	onClick: () => any;
	tooltip: Text;
	isSelected?: () => boolean;
	isDisabled?: () => boolean;
}


export interface TextButtonContent extends AbstractButtonContent {
	title: string,
}

export interface IconButtonContent extends AbstractButtonContent {
	sprite: TextureMap,
	tag: string,
}

export type ButtonContent = TextButtonContent | IconButtonContent;

const buttonHeight = 16;
const spaceBetweenButtons = 1;
const u = 6; // ну это такая штука

export class ButtonRow {

	buttonsCoords: Vec2[] = [];
	hoveredButton: number | undefined = undefined;
	pressedButton: number | undefined = undefined;

	isButtonHovered() {
		return this.hoveredButton !== undefined;
	}

	constructor(private readonly buttons: ButtonContent[], private px: number, private py: number) {
		let xx = 0;
		buttons.forEach(b => {
			const w =
				('title' in b)
					? buttonRenderer.getButtonWidth(b.title)
					: buttonHeight;

			const x = xx;
			this.buttonsCoords.push(vec2(x, x + w));
			xx += w + spaceBetweenButtons;
		});
	}

	render() {
		this.buttons.forEach((button, idx) => {

			const isActive = button.isSelected && button.isSelected();
			const isDisabled = button.isDisabled && button.isDisabled() || false;

			if ('title' in button) {
				buttonRenderer.renderWithText(
					this.buttonsCoords[idx].x + this.px,
					this.py,
					button.title,
					isActive || this.hoveredButton === idx,
					this.pressedButton === idx,
					isDisabled
				);
			} else if ('sprite' in button) {
				buttonRenderer.renderWithIcon(
					this.buttonsCoords[idx].x + this.px,
					this.py,
					button.sprite,
					button.tag,
					isActive || this.hoveredButton === idx,
					this.pressedButton === idx,
					isDisabled
				);
			}

		});
	}

	renderTooltipLayer() {
		if (this.hoveredButton !== undefined) {
			const button = this.buttons[this.hoveredButton];
			if (button.tooltip) {
				const coords = this.buttonsCoords[this.hoveredButton];
				const x = this.px + coords.y;
				textboxRenderer.renderTextBox(
					x, this.py,
					Math.min(100, fw / 2 - x - 2 * u),
					button.tooltip,
					VerticalAlign.BOTTOM,
					HorizontalAlign.LEFT
				);
			}
		}
	}

	update(
		pressedKeyMap: Map<string, boolean>,
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

	renderCommon(
		x: number, y: number,
		w: number,
		hovered: boolean,
		pressed: boolean,
		disabled: boolean
	) {
		const [r1, r2, r3] = this.textureMap.getFrames(
			disabled ? 'Disabled' :
				hovered
					? (pressed ? 'Pressed' : 'Hovered')
					: 'Idle'
		);

		texturedShader.useProgram();
		texturedShader.setTexture('texture', this.textureMap);
		texturedShader.setModel('vertexPosition', defaultRect);

		texturedShader.setFrame(r1);
		texturedShader.setVec2('textureScale', vec2(1, 1));
		texturedShader.draw(vec2(x, y), vec2(u, buttonHeight));

		texturedShader.setFrame(r2);
		texturedShader.setVec2('textureScale', vec2(w / u, 1));
		texturedShader.draw(vec2(x + u, y), vec2(w, buttonHeight));

		texturedShader.setFrame(r3);
		texturedShader.setVec2('textureScale', vec2(1, 1));
		texturedShader.draw(vec2(x + 6 + w, y), vec2(6, buttonHeight));
	}

	renderWithIcon(
		x: number, y: number,
		texture: TextureMap,
		tag: string,
		hovered: boolean,
		pressed: boolean,
		disabled: boolean
	) {
		this.renderCommon(x, y, buttonHeight - 2 * u, hovered, pressed, disabled);
		texturedShader.setSprite(texture, tag);
		texturedShader.draw(vec2(x, y), vec2(buttonHeight, buttonHeight));
	}

	renderWithText(
		x: number, y: number,
		text: string,
		hovered: boolean,
		pressed: boolean,
		disabled: boolean
	) {

		const w = this.getButtonWidth(text) - 2 * u;
		this.renderCommon(x, y, w, hovered, pressed, disabled);
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
			ShadowStyle.DIAGONAL
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
