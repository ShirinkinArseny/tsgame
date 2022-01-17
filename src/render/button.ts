import {Loadable} from './utils/loadable';
import {Destroyable} from './utils/destroyable';
import {ImageTexture} from './textures/imageTexture';
import {Align, Font, FontStyle} from './font';
import {Rect} from './shapes/rect';
import {identity, Mat4, multiplyMatToVec, scale, translate, Vec4} from './utils/matrices';
import {LoadableShader} from './shaders/loadableShader';
import {drawTriangles} from './utils/gl';


export class Button implements Loadable, Destroyable {

	gl: WebGLRenderingContext;
	texture: ImageTexture;
	texturedShader: LoadableShader;
	font: Font;
	r1: Rect;
	r2: Rect;
	r3: Rect;
	r4: Rect;
	r5: Rect;
	r6: Rect;
	r: Rect;
	cx: number;
	cy: number;
	pressed: boolean;
	clicked: boolean;

	constructor(gl: WebGLRenderingContext) {
		this.gl = gl;
		this.texture = new ImageTexture(gl, 'button.png');
		this.font = new Font(gl);
		this.texturedShader = new LoadableShader(gl, 'textured');
		this.r = new Rect(gl, 0, 0, 1, 16);
		this.r1 = new Rect(gl, 0, 0, 6 / 64, 1);
		this.r2 = new Rect(gl, 6 / 64, 0, 7 / 32, 1);
		this.r3 = new Rect(gl, 26 / 64, 0, 32 / 64, 1);
		this.r4 = new Rect(gl, 1 / 2 + 0, 0, 1 / 2 + 6 / 64, 1);
		this.r5 = new Rect(gl, 1 / 2 + 6 / 64, 0, 1 / 2 + 7 / 32, 1);
		this.r6 = new Rect(gl, 1 / 2 + 26 / 64, 0, 1 / 2 + 32 / 64, 1);
	}

	update(dt: number, pressedKeyMap: Map<number, boolean>,
		scrToPx: Mat4,
		cursorX: number, cursorY: number, cursorPressed: boolean) {
		[this.cx, this.cy] = multiplyMatToVec(scrToPx, [cursorX, cursorY, 0, 1]);
		this.clicked = cursorPressed && !this.pressed;
		this.pressed = cursorPressed;
	}

	render(
		x: number, y: number, text: string,
		projMatrix: Mat4,
		onClick: () => any,
	) {

		const w = this.font.getStringWidth(text, FontStyle.BOLD);

		let hovered = false;
		if (x <= this.cx && this.cx <= (x + w + 12) && y <= this.cy && this.cy <= (y + 16)) {
			hovered = true;
			if (this.clicked) {
				onClick();
			}
		}

		const [r1, r2, r3] = hovered ? [this.r4, this.r5, this.r6] : [this.r1, this.r2, this.r3];


		this.texturedShader.useProgram();

		this.texturedShader.setTexture('texture', this.texture);
		this.texturedShader.setMatrix('projectionMatrix', projMatrix);
		this.texturedShader.setMatrix(
			'modelMatrix',
			scale(translate(identity(), [x, y, 0]), [6, 1, 1]),
		);
		this.texturedShader.setModel('aVertexPosition', this.r);
		this.texturedShader.setModel('aTexturePosition', r1);
		drawTriangles(this.gl, this.r.indicesCount);

		this.texturedShader.setTexture('texture', this.texture);
		this.texturedShader.setMatrix('projectionMatrix', projMatrix);
		this.texturedShader.setMatrix(
			'modelMatrix',
			scale(translate(identity(), [x + 6, y, 0]), [w, 1, 1]),
		);
		this.texturedShader.setModel('aVertexPosition', this.r);
		this.texturedShader.setModel('aTexturePosition', r2);
		drawTriangles(this.gl, this.r.indicesCount);

		this.texturedShader.setTexture('texture', this.texture);
		this.texturedShader.setMatrix('projectionMatrix', projMatrix);
		this.texturedShader.setMatrix(
			'modelMatrix',
			scale(translate(identity(), [x + 6 + w, y, 0]), [6, 1, 1]),
		);
		this.texturedShader.setModel('aVertexPosition', this.r);
		this.texturedShader.setModel('aTexturePosition', r3);
		drawTriangles(this.gl, this.r.indicesCount);

		const a = [102, 57, 49, 255].map(r => r / 255) as Vec4;
		const b = [237, 180, 122, 255].map(r => r / 255) as Vec4;
		const c = [255, 240, 200, 255].map(r => r / 255) as Vec4;

		this.font.drawString(
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
				this.font.load(),
				this.texturedShader.load()
			]
		);
	}

	destroy() {
		this.texture.destroy();
		this.font.destroy();
		this.texturedShader.destroy();
	}


}
