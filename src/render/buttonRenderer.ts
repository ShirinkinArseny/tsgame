import {Loadable} from './utils/loadable';
import {Destroyable} from './utils/destroyable';
import {HorizontalAlign, FontStyle, ShadowStyle, VerticalAlign, Text} from './fontRenderer';
import {Rect} from './shapes/rect';
import {identity, scale, translate} from './utils/matrices';
import {fontRenderer, textboxRenderer, texturedShader} from '../sharedResources';
import {TextureMap} from './textureMap';
import {Mat4, vec2, Vec2, vec3, vec4, Vec4} from './utils/vector';
import {PointerEvent} from '../events';

interface ButtonContent {
	title: string;
	onClick: () => any;
	tooltip: Text;
}


export class ButtonRenderer implements Loadable, Destroyable {

	textureMap: TextureMap = new TextureMap('ui/button/button');


	r: Rect = new Rect(0, 0, 1, 16);

	pointerEvent: PointerEvent = new PointerEvent(vec2(), false, false);
	tooltip: [Text, Vec2] | undefined = undefined;

	update(dt: number, pressedKeyMap: Map<string, boolean>,
		scrToPx: Mat4,
		pointerEvent: PointerEvent
	) {
		this.pointerEvent = new PointerEvent(
			vec4(pointerEvent.xy.x, pointerEvent.xy.y, 0, 1).times(scrToPx).xy,
			pointerEvent.isCursorPressed,
			pointerEvent.isCursorClicked
		);
		this.tooltip = undefined;
	}

	renderButtonsRow(
		x: number, y: number, projMatrix: Mat4,
		buttons: ButtonContent[]
	) {

		const gapBetweenButtons = 2;
		let xx = x;
		buttons.forEach(b => {
			xx += this.renderSingleButtons(
				xx,
				y,
				b.title,
				b.tooltip,
				projMatrix,
				b.onClick
			) + gapBetweenButtons;
		});

	}

	renderSingleButtons(
		x: number, y: number, text: string, tooltip: Text | undefined,
		projMatrix: Mat4,
		onClick: () => any,
	) {

		const w = fontRenderer.getStringWidth(text, FontStyle.BOLD);

		let hovered = false;
		if (x <= this.pointerEvent.xy.x && this.pointerEvent.xy.x <= (x + w + 12) && y <= this.pointerEvent.xy.y && this.pointerEvent.xy.y <= (y + 16)) {
			hovered = true;
			if (this.pointerEvent.isCursorClicked) {
				onClick();
			}
		}

		const [r1, r2, r3] = this.textureMap.getRects(
			hovered
				? (this.pointerEvent?.isCursorPressed ? 'Pressed' : 'Hovered')
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

		if (hovered && tooltip) {
			this.tooltip = [
				tooltip,
				vec2(
					x + w + 12,
					y
				)
			];
		}

		return w + 12;

	}

	renderTooltipsLayer(
		projMatrix: Mat4,
	) {
		const t = this.tooltip;
		if (t) {
			textboxRenderer.renderTextBox(
				t[1].x, t[1].y, 120, t[0],
				projMatrix,
				VerticalAlign.BOTTOM,
				HorizontalAlign.LEFT
			);
		}
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
