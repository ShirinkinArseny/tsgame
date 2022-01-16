import {Destroyable} from './utils/destroyable';
import {ImageTexture} from './textures/imageTexture';
import {Rect} from './shapes/rect';
import {identity, Mat4, ortho, scale, translate, Vec3, Vec4} from './utils/matrices';
import {splitImage} from '../splitImage';
import {LoadableShader} from './shaders/loadableShader';
import {drawTriangles} from './utils/gl';
import {Loadable} from './utils/loadable';

export enum FontStyle {
	NORMAL, BOLD
}

export enum Align {
	LEFT, RIGHT, CENTER
}

const fontStyles = [FontStyle.NORMAL, FontStyle.BOLD];

const alphabet = [
	'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	'abcdefghijklmnopqrstuvwxyz',
	'1234567890.,:;=~\'"!$%^?*()[]<>_+-|/\\',
	'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
	'абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
	'○◐●△◭▲'
];

const spaceWidth = 4;

export type Text = {
	word: string,
	fontStyle: FontStyle
}[];

export class Font implements Destroyable, Loadable {

	private readonly gl: WebGLRenderingContext;
	private fontImage: ImageTexture;
	private mainRectangle: Rect;
	private symbolRectangles: { [k: number]: { [k: string]: [number, Rect] } };
	private shader: LoadableShader;
	private lineHeight: number;

	constructor(gl: WebGLRenderingContext) {
		this.gl = gl;
		this.mainRectangle = new Rect(this.gl, 0, 0, 1, 1);
		this.shader = new LoadableShader(gl, 'font');
		this.fontImage = new ImageTexture(gl, 'font2.png');
	}

	load() {
		return Promise.all([
			this.shader.load(),
			this.fontImage.load()
				.then(i => {

					const [lineHeight, lines] = splitImage(i);
					this.lineHeight = lineHeight;
					const a = Object.fromEntries(
						fontStyles.map((style, styleIdx) => [
							style,
							Object.fromEntries(
								alphabet
									.map((line, lineIdx) => {
										const bounds = lines[lineIdx + styleIdx * alphabet.length];
										return line.split('').map((symbol, symbolIdx) => {
											const bound = bounds[symbolIdx];
											if (!bound) {
												throw new Error('WTF?');
											}
											const yy = (lineIdx + styleIdx * alphabet.length) * (lineHeight + 2);
											const args = [
												(bound[0]),
												yy,
												(bound[1] + 1),
												yy + lineHeight,
											];
											const w = bound[1] - bound[0] + 1;
											return [symbol, [w, new Rect(
												this.gl,
												...args.map(v => v / i.width)
											)]];
										});
									})
									.flat(1)
							)
						])
					);
					this.symbolRectangles = a;

				})
		]);
	}

	destroy() {
		this.fontImage.destroy();
		this.mainRectangle.destroy();
		Object.values(this.symbolRectangles).flat()
			.map(v => Object.values(v))
			.flat(1)
			.map(v => v[1]).forEach(r => r.destroy());
		this.shader.destroy();
	}

	private drawSymbol(
		symbol: string, x: number, y: number, fontStyle: FontStyle
	): number {
		const letter = this.symbolRectangles[fontStyle][symbol];
		if (!letter) return spaceWidth;
		this.shader.setMatrix(
			'modelMatrix',

			scale(translate(identity(),
				[x, y, 0.0]
			), [letter[0], this.lineHeight, 1.0])
		);
		this.mainRectangle.bindModel(this.shader.getAttribute('aVertexPosition'));
		letter[1].bindModel(this.shader.getAttribute('aTexturePosition'));
		drawTriangles(this.gl, this.mainRectangle.indicesCount);
		return letter[0];
	}

	getStringWidth(
		str: string,
		fontStyle: FontStyle,
		kerning = 1.0
	): number {
		return str.split('').map(s => {
			const ss = this.symbolRectangles[fontStyle][s];
			if (!ss) return spaceWidth;
			return ss[0];
		}).reduce((a, b) => a + b + kerning, 0);
	}

	private doDrawString(
		string: string, x: number, y: number,
		kerning: number, fontStyle: FontStyle,
		align: Align
	) {
		let xx = x;
		if (align !== Align.LEFT) {
			const w = this.getStringWidth(string, fontStyle, kerning);
			if (align === Align.CENTER) {
				xx -= w/2;
			} else if (align === Align.RIGHT) {
				xx -= w;
			}
		}
		for (let i = 0; i < string.length; i++) {
			xx += this.drawSymbol(string[i], xx, y, fontStyle) + kerning;
		}
	}

	private initRenderingText(projectionMatrix: Mat4, color: Vec4) {
		this.shader.useProgram();
		this.shader.setMatrix(
			'projectionMatrix',
			projectionMatrix
		);
		this.shader.setVector4f('color', color);
		this.shader.setTexture('texture', this.fontImage);
	}

	drawString(
		text: string, x: number, y: number,
		fontStyle: FontStyle = FontStyle.NORMAL,
		color: Vec4 = [0, 0, 0, 1],
		projectionMatrix: Mat4,
		align: Align = Align.LEFT,
		kerning = 1.0
	) {
		this.initRenderingText(projectionMatrix, color);
		this.doDrawString(text, x, y, kerning, fontStyle, align);
	}

	drawText(
		text: Text,
		x: number, y: number, w: number,
		color: Vec4 = [0, 0, 0, 1],
		projectionMatrix: Mat4,
		kerning = 1.0,
		lineHeight = 1.0
	) {
		let xx = x;
		let yy = y;
		const x2 = x + w;
		this.initRenderingText(projectionMatrix, color);
		text.forEach(({word, fontStyle}) => {
			const w = this.getStringWidth(word, fontStyle);
			if (xx + w * kerning >= x + x2) {
				xx = x;
				yy += lineHeight;
			}
			this.doDrawString(word, xx, yy, kerning, fontStyle, Align.LEFT);
			xx += (w + spaceWidth) * kerning;
		});

	}

}
