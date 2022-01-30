import {Destroyable} from './utils/destroyable';
import {ImageTexture} from './textures/imageTexture';
import {Rect} from './shapes/rect';
import {splitImage} from '../splitImage';
import {LoadableShader} from './shaders/loadableShader';
import {Loadable} from './utils/loadable';
import {range} from './utils/lists';
import {vec2, Vec3, vec3, vec4, Vec4} from './utils/vector';
import {defaultRect} from '../sharedResources';

export enum FontStyle {
	NORMAL, BOLD
}

export enum HorizontalAlign {
	LEFT, RIGHT, CENTER
}

export enum VerticalAlign {
	TOP, BOTTOM
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

export type Word = {
	word: string,
	fontStyle: FontStyle
};

export type NewLine = undefined;

export type TextElement = Word | NewLine;

export type Text = TextElement[];

export function buildText(
	text: string,
	fontStyle: FontStyle = FontStyle.NORMAL
): Text {
	const textElements: TextElement[] = [];
	const lastWord: string[] = [];
	const pushLastWord = () => {
		if (lastWord.length > 0) {
			textElements.push({
				word: lastWord.join(''),
				fontStyle: fontStyle
			});
			lastWord.splice(0, lastWord.length);
		}
	};
	text.split('').forEach(letter => {
		if (letter === ' ') {
			pushLastWord();
		} else if (letter === '\n') {
			pushLastWord();
			textElements.push(undefined);
		} else {
			lastWord.push(letter);
		}
	});
	pushLastWord();
	return textElements;
}

export class FontRenderer implements Destroyable, Loadable {

	private readonly fontImage: ImageTexture = new ImageTexture('ui/font/font.png');
	private symbolRectangles = new Map<FontStyle, Map<string, [number, Rect]>>();
	private shader: LoadableShader = new LoadableShader('font');
	lineHeight: number = 0;

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
		this.symbolRectangles.valuesList().flat()
			.map(v => Object.values(v))
			.flat(1)
			.map(v => v[1]).forEach(r => r.destroy());
		this.shader.destroy();
	}

	private getSymbol(symbol: string, style: FontStyle) {
		let r = this.symbolRectangles.get(style)?.get(symbol);
		if (r) return r;
		for (const v of this.symbolRectangles.values()) {
			r = v.get(symbol);
			if (r) return r;
		}
		return undefined;
	}

	private drawSymbol(
		symbol: string, x: number, y: number, fontStyle: FontStyle
	): number {
		const letter = this.getSymbol(symbol, fontStyle);
		if (!letter) return spaceWidth;
		this.shader.setModel('vertexPosition', defaultRect);
		this.shader.setModel('texturePosition', letter[1]);
		this.shader.draw(
			vec2(x, y),
			vec2(letter[0], this.lineHeight)
		);
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
		align: HorizontalAlign
	) {
		let xx = x;
		if (align !== HorizontalAlign.LEFT) {
			const w = this.getStringWidth(string, fontStyle, kerning);
			if (align === HorizontalAlign.CENTER) {
				xx -= w / 2;
			} else if (align === HorizontalAlign.RIGHT) {
				xx -= w;
			}
		}
		xx = Math.floor(xx);
		for (let i = 0; i < string.length; i++) {
			xx += this.drawSymbol(string[i], xx, y, fontStyle) + kerning;
		}
	}

	private initRenderingTextColor(color: Vec4) {
		this.shader.setVec4('color', color);
	}

	private initRenderingText(color: Vec4) {
		this.shader.useProgram();
		this.shader.setTexture('texture', this.fontImage);
		this.initRenderingTextColor(color);
	}

	drawString(
		text: string, x: number, y: number,
		fontStyle: FontStyle = FontStyle.NORMAL,
		color: Vec4 = vec4(0, 0, 0, 1),
		align: HorizontalAlign = HorizontalAlign.LEFT,
		kerning = 1.0,
		shadowStyle: ShadowStyle = ShadowStyle.NO,
		shadowColor: Vec4 = vec4(0, 0, 0, 0.7)
	) {
		const yy = Math.floor(y);
		this.initRenderingText(shadowStyle === ShadowStyle.NO ? color : shadowColor);
		if (shadowStyle !== ShadowStyle.NO) {
			if (shadowStyle === ShadowStyle.DIAGONAL) {
				this.doDrawString(text, x + 1, yy + 1, kerning, fontStyle, align);
			}
			if (shadowStyle === ShadowStyle.STROKE) {
				for (let dx = -1; dx <= 1; dx++) {
					for (let dy = -1; dy <= 1; dy++) {
						if (dx !== 0 || dy !== 0) {
							this.doDrawString(text, x + dx, yy + dy, kerning, fontStyle, align);
						}
					}
				}
			}
			this.initRenderingTextColor(color);
		}
		this.doDrawString(text, x, yy, kerning, fontStyle, align);
	}

	getTextPositions(
		text: Text,
		width: number,
		lineHeight = this.lineHeight,
		kerning = 1.0
	): Vec3[] {
		let xx = 0;
		let yy = 0;
		const wordsPositions: Vec3[] = [];
		text.forEach(textElemement => {
			const w = textElemement && this.getStringWidth(textElemement.word, textElemement.fontStyle);
			if (!w || xx + w * kerning >= width) {
				xx = 0;
				yy += lineHeight;
			}
			wordsPositions.push(vec3(xx, yy, w));
			if (w) {
				xx += (w + spaceWidth) * kerning;
			}
		});
		return wordsPositions;
	}

	drawText(
		text: Text,
		x: number, y: number, w: number,
		color: Vec4 = vec4(0, 0, 0, 1),
		lineHeight = this.lineHeight,
		kerning = 1.0
	) {
		const xx = Math.floor(x);
		const yy = Math.floor(y);
		const textPositions = this.getTextPositions(text, w, lineHeight, kerning);
		this.initRenderingText(color);
		text.forEach((textElement, idx) => {
			if (textElement) {
				const pos = textPositions[idx];
				this.doDrawString(textElement.word, pos.x + xx, pos.y + yy, kerning, textElement.fontStyle, HorizontalAlign.LEFT);
			}
		});
	}

}
