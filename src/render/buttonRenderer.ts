import {Loadable} from './utils/loadable';
import {Destroyable} from './utils/destroyable';
import {Align, FontStyle, ShadowStyle} from './fontRenderer';
import {Rect} from './shapes/rect';
import {identity, scale, translate} from './utils/matrices';
import {fontRenderer, texturedShader} from '../sharedResources';
import {TextureMap} from './textureMap';
import {Mat4, vec3, vec4, Vec4} from './utils/vector';

interface ButtonContent {
	title: string;
	onClick: () => any;
}


export class ButtonRenderer implements Loadable, Destroyable {

	textureMap: TextureMap = new TextureMap('ui/button/button');


	r: Rect = new Rect(0, 0, 1, 16);

	cx: number = 0;
	cy: number = 0;
	pressed: boolean = false;
	clicked: boolean = false;

	update(dt: number, pressedKeyMap: Map<string, boolean>,
		scrToPx: Mat4,
		cursorX: number, cursorY: number, cursorPressed: boolean) {
		[this.cx, this.cy] = vec4(cursorX, cursorY, 0, 1).times(scrToPx);
		this.clicked = cursorPressed && !this.pressed;
		this.pressed = cursorPressed;
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
				projMatrix,
				b.onClick
			) + gapBetweenButtons;
		});

	}

	renderSingleButtons(
		x: number, y: number, text: string,
		projMatrix: Mat4,
		onClick: () => any,
	) {

		const w = fontRenderer.getStringWidth(text, FontStyle.BOLD);

		let hovered = false;
		if (x <= this.cx && this.cx <= (x + w + 12) && y <= this.cy && this.cy <= (y + 16)) {
			hovered = true;
			if (this.clicked) {
				onClick();
			}
		}

		const [r1, r2, r3] = this.textureMap.getRects(
			hovered
				? (this.pressed ? 'Pressed' : 'Hovered')
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
			Align.LEFT,
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
