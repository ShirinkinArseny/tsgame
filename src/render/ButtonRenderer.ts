import {Loadable} from './utils/Loadable';
import {Destroyable} from './utils/Destroyable';
import {HorizontalAlign, FontStyle, ShadowStyle, Text} from './FontRenderer';
import {buttonRenderer, defaultRect, fontRenderer, texturedShader} from '../SharedResources';
import {TextureMap} from './TextureMap';
import {vec2, Vec4} from './utils/Vector';
import {pointerLayer} from './PointerLayer';
import {tooltipLayer} from './TooltipLayer';


export interface AbstractButtonContent {
	onClick: () => any;
	isSelected?: () => boolean;
	isDisabled?: () => boolean;
	tooltip: Text;
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

	private hoveredButton: number | undefined = undefined;
	private pressedButton: number | undefined = undefined;

	constructor(private readonly buttons: () => ButtonContent[], private x: number, private y: number) {
	}

	draw() {
		let xx = 0;
		this.buttons().forEach((button, idx) => {
			const isActive = button.isSelected && button.isSelected();
			const isDisabled = button.isDisabled && button.isDisabled() || false;
			let w: number;
			if ('title' in button) {
				w = buttonRenderer.renderWithText(
					xx + this.x,
					this.y,
					button.title,
					isActive || this.hoveredButton === idx,
					this.pressedButton === idx,
					isDisabled
				);
			} else if ('sprite' in button) {
				w = buttonRenderer.renderWithIcon(
					xx + this.x,
					this.y,
					button.sprite,
					button.tag,
					isActive || this.hoveredButton === idx,
					this.pressedButton === idx,
					isDisabled
				);
			} else throw new Error('???');
			tooltipLayer.registerTooltip({
				x: xx + this.x,
				y: this.y,
				w: w,
				h: buttonHeight,
				tooltip: button.tooltip
			});
			pointerLayer.listen({
				x: xx + this.x,
				y: this.y,
				w: w,
				h: buttonHeight,
				on: (e) => {
					this.hoveredButton = idx;
					if (e.isCursorPressed) {
						this.pressedButton = idx;
					}
					if (e.isCursorClicked) {
						button.onClick();
						e.cancelled = true;
					}
				}
			});
			xx += w + spaceBetweenButtons;
		});
		this.hoveredButton = undefined;
		this.pressedButton = undefined;
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
		return buttonHeight;
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
