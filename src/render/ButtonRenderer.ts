import {Loadable} from './utils/Loadable';
import {Destroyable} from './utils/Destroyable';
import {HorizontalAlign, FontStyle, ShadowStyle, VerticalAlign, Text} from './FontRenderer';
import {buttonRenderer, defaultRect, fontRenderer, textboxRenderer, texturedShader} from '../SharedResources';
import {TextureMap} from './TextureMap';
import {vec2, Vec2, Vec4} from './utils/Vector';
import {PointerEvent} from '../Events';


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

export type TooltippedHoverable = {
	position: Vec2,
	width: number,
	height: number,
	tooltip: Text
}

export abstract class TooltippedItemsRow {

	protected hovered: TooltippedHoverable | undefined;

	protected constructor(
		protected x: number,
		protected y: number
	) {
	}

	abstract getItems(): TooltippedHoverable[];

	update(
		pointerEvent: PointerEvent
	) {
		this.hovered = undefined;
		const ptr = pointerEvent.xy;
		this.getItems().forEach(item => {
			if (
				item.position.x <= ptr.x &&
				ptr.x <= item.position.x + item.width &&
				item.position.y <= ptr.y &&
				ptr.y <= item.position.y + item.height
			) {
				this.hovered = item;
			}
		});
	}

	renderTooltipLayer() {
		if (this.hovered) {
			textboxRenderer.renderTextBox(
				this.hovered.position.x + this.hovered.width,
				this.hovered.position.y,
				100,
				this.hovered.tooltip,
				VerticalAlign.BOTTOM,
				HorizontalAlign.LEFT
			);
		}
	}

}

export type TooltippedIcon = {
	icon: string,
	tooltip: Text
}

export const tooltippedIconSize = 12;

export class TooltippedIcons extends TooltippedItemsRow {


	constructor(
		private readonly icons: () => TooltippedIcon[],
		x: number, y: number,
		private iconsMap: TextureMap
	) {
		super(x, y);
	}

	getItems(): TooltippedHoverable[] {
		return this.icons().map((icon, idx) => ({
			position: vec2(
				this.x + idx * tooltippedIconSize,
				this.y
			),
			width: tooltippedIconSize,
			height: tooltippedIconSize,
			tooltip: icon.tooltip
		}));
	}

	draw() {
		this.renderTooltipLayer();
		let xx = this.x;
		this.icons().forEach(icon => {
			texturedShader.useProgram();
			texturedShader.setSprite(this.iconsMap, icon.icon);
			texturedShader.draw(
				vec2(xx, this.y),
				vec2(tooltippedIconSize, tooltippedIconSize)
			);
			xx += tooltippedIconSize;
		});
	}

}

const getButtonWidth = (buttonContent: ButtonContent) => {
	return ('title' in buttonContent)
		? buttonRenderer.getButtonWidth(buttonContent.title)
		: buttonHeight;
};

export class ButtonRow extends TooltippedItemsRow {

	private hoveredButton: number | undefined = undefined;
	private pressedButton: number | undefined = undefined;

	constructor(private readonly buttons: () => ButtonContent[], x: number, y: number) {
		super(x, y);
	}

	getItems() {
		const res: TooltippedHoverable[] = [];
		let xx = 0;
		this.buttons().forEach(b => {
			const w = getButtonWidth(b);
			const x = xx;
			res.push({
				position: vec2(
					this.x + x,
					this.y,
				),
				width: w,
				height: buttonHeight,
				tooltip: b.tooltip
			});
			xx += w + spaceBetweenButtons;
		});
		return res;
	}

	isButtonHovered() {
		return this.hoveredButton !== undefined;
	}


	draw() {
		let xx = 0;
		this.buttons().forEach((button, idx) => {
			const isActive = button.isSelected && button.isSelected();
			const isDisabled = button.isDisabled && button.isDisabled() || false;
			if ('title' in button) {
				xx += buttonRenderer.renderWithText(
					xx + this.x,
					this.y,
					button.title,
					isActive || this.hoveredButton === idx,
					this.pressedButton === idx,
					isDisabled
				);
			} else if ('sprite' in button) {
				xx += buttonRenderer.renderWithIcon(
					xx + this.x,
					this.y,
					button.sprite,
					button.tag,
					isActive || this.hoveredButton === idx,
					this.pressedButton === idx,
					isDisabled
				);
			}
			xx += spaceBetweenButtons;
		});
	}

	update(
		pointerEvent: PointerEvent
	) {
		super.update(pointerEvent);
		const ptr = pointerEvent.xy;
		this.hoveredButton = undefined;
		this.pressedButton = undefined;
		let xx = 0;
		this.buttons().forEach((btn, idx) => {
			if (pointerEvent.cancelled) return;
			const w = getButtonWidth(btn);
			if (
				xx + this.x <= ptr.x &&
				ptr.x <= xx + this.x + w &&
				this.y <= ptr.y &&
				ptr.y <= this.y + buttonHeight
			) {
				this.hoveredButton = idx;
				if (pointerEvent.isCursorPressed) {
					this.pressedButton = idx;
				}
				if (pointerEvent.isCursorClicked) {
					btn.onClick();
					pointerEvent.cancelled = true;
				}
			}
			xx += w + spaceBetweenButtons;
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
