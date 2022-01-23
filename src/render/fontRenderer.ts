import {Destroyable} from './utils/destroyable';
import {ImageTexture} from './textures/imageTexture';
import {Rect} from './shapes/rect';
import {identity, Mat4, scale, translate, Vec4} from './utils/matrices';
import {splitImage} from '../splitImage';
import {LoadableShader} from './shaders/loadableShader';
import {Loadable} from './utils/loadable';
import {range} from './utils/lists';

export enum FontStyle {
	NORMAL, BOLD
}

export enum Align {
	LEFT, RIGHT, CENTER
}

export enum ShadowStyle {
	NO,
	DIAGONAL,
	STROKE
}

const styledAlphabet = [
	'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	'abcdefghijklmnopqrstuvwxyz',
	'1234567890.,:;=~\'"!$%^?*()[]<>_+-|/\\',
	'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
	'абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
];

const symbolicAlphabet = [
	'○◐●△◭▲',
];

const alphabet = [
	...range(0, 1).map(fontStyleIdx => styledAlphabet.map(line =>
		line.split('').map(char => ({
			char: char,
			style: fontStyleIdx
		}))
	)).flat(1),
	...symbolicAlphabet.map(line => line.split('').map(char => ({
		char: char,
		style: FontStyle.NORMAL
	})))
];

const spaceWidth = 4;

export type Text = {
	word: string,
	fontStyle: FontStyle
}[];

export class FontRenderer implements Destroyable, Loadable {

	private readonly fontImage: ImageTexture = new ImageTexture('ui/font/font.png');
	private readonly mainRectangle: Rect = new Rect(0, 0, 1, 1);
	private symbolRectangles = new Map<FontStyle, Map<string, [number, Rect]>>();
	private shader: LoadableShader = new LoadableShader('font');
	private lineHeight: number = 0;

	load() {
		return Promise.all([
			this.shader.load(),
			this.fontImage.load()
				.then(i => {
					const [lineHeight, lines] = splitImage(i);
					this.lineHeight = lineHeight;
					alphabet.forEach((line, lineIdx) => {
						const bounds = lines[lineIdx];
						return line.forEach(
							(v, symbolIdx) => {
								const char = v.char;
								const style = v.style;
								const bound = bounds[symbolIdx];
								if (!bound) {
									throw new Error('WTF?');
								}
								const yy = lineIdx * (lineHeight + 2);
								const args = [
									(bound[0]),
									yy,
									(bound[1] + 1),
									yy + lineHeight,
								];
								const w = bound[1] - bound[0] + 1;

								const styleMap = this.symbolRectangles.get(style) || new Map<string, [number, Rect]>();
								this.symbolRectangles.set(style, styleMap);
								styleMap.set(char, [w, new Rect(
									...args.map(v => v / i.width)
								)]);
							});
					});
				})
		]);
	}

	destroy() {
		this.fontImage.destroy();
		this.mainRectangle.destroy();
		this.symbolRectangles.valuesList().flat()
			.map(v => Object.values(v))
			.flat(1)
			.map(v => v[1]).forEach(r => r.destroy());
		this.shader.destroy();
	}

	private drawSymbol(
		symbol: string, x: number, y: number, fontStyle: FontStyle
	): number {
		const letter = this.symbolRectangles.get(fontStyle)?.get(symbol);
		if (!letter) return spaceWidth;
		this.shader.setMatrix(
			'modelMatrix',

			scale(translate(identity(),
				[x, y, 0.0]
			), [letter[0], this.lineHeight, 1.0])
		);
		this.shader.setModel('aVertexPosition', this.mainRectangle);
		this.shader.setModel('aTexturePosition', letter[1]);
		this.shader.draw();
		return letter[0];
	}

	getStringWidth(
		str: string,
		fontStyle: FontStyle,
		kerning = 1.0
	): number {
		return str.split('').map(s => {
			const ss = this.symbolRectangles.get(fontStyle)?.get(s);
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
				xx -= w / 2;
			} else if (align === Align.RIGHT) {
				xx -= w;
			}
		}
		for (let i = 0; i < string.length; i++) {
			xx += this.drawSymbol(string[i], xx, y, fontStyle) + kerning;
		}
	}

	private initRenderingTextColor(color: Vec4) {
		this.shader.setVector4f('color', color);
	}

	private initRenderingText(projectionMatrix: Mat4, color: Vec4) {
		this.shader.useProgram();
		this.shader.setMatrix(
			'projectionMatrix',
			projectionMatrix
		);
		this.shader.setTexture('texture', this.fontImage);
		this.initRenderingTextColor(color);
	}

	drawString(
		text: string, x: number, y: number,
		fontStyle: FontStyle = FontStyle.NORMAL,
		color: Vec4 = [0, 0, 0, 1],
		projectionMatrix: Mat4,
		align: Align = Align.LEFT,
		kerning = 1.0,
		shadowStyle: ShadowStyle = ShadowStyle.NO,
		shadowColor: Vec4 = [0, 0, 0, 0.7]
	) {
		this.initRenderingText(projectionMatrix, shadowStyle === ShadowStyle.NO ? color : shadowColor);
		if (shadowStyle !== ShadowStyle.NO) {
			if (shadowStyle === ShadowStyle.DIAGONAL) {
				this.doDrawString(text, x + 1, y + 1, kerning, fontStyle, align);
			}
			if (shadowStyle === ShadowStyle.STROKE) {
				for (let dx = -1; dx <= 1; dx++) {
					for (let dy = -1; dy <= 1; dy++) {
						if (dx !== 0 || dy !== 0) {
							this.doDrawString(text, x + dx, y + dy, kerning, fontStyle, align);
						}
					}
				}
			}
			this.initRenderingTextColor(color);
		}
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
