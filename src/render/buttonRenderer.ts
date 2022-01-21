import {Loadable} from './utils/loadable';
import {Destroyable} from './utils/destroyable';
import {ImageTexture} from './textures/imageTexture';
import {Align, FontStyle} from './fontRenderer';
import {Rect} from './shapes/rect';
import {identity, Mat4, multiplyMatToVec, scale, translate, Vec4} from './utils/matrices';
import {fontRenderer, texturedShader} from '../sharedResources';

interface ButtonContent {
	title: string;
	onClick: () => any;
}


export class ButtonRenderer implements Loadable, Destroyable {

	texture: ImageTexture = new ImageTexture('button.png');
	r: Rect = new Rect(0, 0, 1, 16);
	r1: Rect = new Rect(0, 0, 6 / 64, 1);
	r2: Rect = new Rect(6 / 64, 0, 7 / 32, 1);
	r3: Rect = new Rect(26 / 64, 0, 32 / 64, 1);
	r4: Rect = new Rect(1 / 2 + 0, 0, 1 / 2 + 6 / 64, 1);
	r5: Rect = new Rect(1 / 2 + 6 / 64, 0, 1 / 2 + 7 / 32, 1);
	r6: Rect = new Rect(1 / 2 + 26 / 64, 0, 1 / 2 + 32 / 64, 1);
	cx: number = 0;
	cy: number = 0;
	pressed: boolean = false;
	clicked: boolean = false;

	update(dt: number, pressedKeyMap: Map<number, boolean>,
		scrToPx: Mat4,
		cursorX: number, cursorY: number, cursorPressed: boolean) {
		[this.cx, this.cy] = multiplyMatToVec(scrToPx, [cursorX, cursorY, 0, 1]);
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

		const [r1, r2, r3] = hovered ? [this.r4, this.r5, this.r6] : [this.r1, this.r2, this.r3];


		texturedShader.useProgram();

		texturedShader.setTexture('texture', this.texture);
		texturedShader.setMatrix('projectionMatrix', projMatrix);
		texturedShader.setMatrix(
			'modelMatrix',
			scale(translate(identity(), [x, y, 0]), [6, 1, 1]),
		);
		texturedShader.setModel('aVertexPosition', this.r);
		texturedShader.setModel('aTexturePosition', r1);
		texturedShader.draw();

		texturedShader.setTexture('texture', this.texture);
		texturedShader.setMatrix('projectionMatrix', projMatrix);
		texturedShader.setMatrix(
			'modelMatrix',
			scale(translate(identity(), [x + 6, y, 0]), [w, 1, 1]),
		);
		texturedShader.setModel('aVertexPosition', this.r);
		texturedShader.setModel('aTexturePosition', r2);
		texturedShader.draw();

		texturedShader.setTexture('texture', this.texture);
		texturedShader.setMatrix('projectionMatrix', projMatrix);
		texturedShader.setMatrix(
			'modelMatrix',
			scale(translate(identity(), [x + 6 + w, y, 0]), [6, 1, 1]),
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
			a
		);

		return w + 12;

	}

	load(): Promise<any> {
		return Promise.all(
			[
				this.texture.load(),
				fontRenderer.load(),
			]
		);
	}

	destroy() {
		this.texture.destroy();
		fontRenderer.destroy();
	}


}
