import {Destroyable} from './utils/Destroyable';
import {ImageTexture} from './textures/ImageTexture';
import {Rect} from './shapes/Rect';
import {splitImage} from '../SplitImage';
import {LoadableShader} from './shaders/LoadableShader';
import {Loadable} from './utils/Loadable';
import {range} from './utils/Lists';
import {Vec2, vec2, vec4, Vec4} from './utils/Vector';
import {coloredShader, defaultRect, fontRenderer} from '../SharedResources';
import {Scene} from '../Scene';
import {Colors, defaultColor} from './utils/Colors';
import {error} from './utils/Errors';
import {BorderedShape} from './shapes/BorderedShape';

export enum FontStyle {
	REGULAR, BOLD, SMALL, SMALL_ITALIC
}

export const defaultFontStyle = FontStyle.REGULAR;

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
	'ABCDEFGHIJKLMNOPQRSTUVWXYZЮЯ_-|',
	'abcdefghijklmnopqrstuvwxyzюя+/\\',
	'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭ',
	'абвгдеёжзийклмнопрстуфхцчшщъыьэ',
	'1234567890.,:;=~\'"!$%^?*()[]<>#'
];

const symbolicAlphabet = [
	...'❤🕐🦶📏🔪🏹⏰✨',
];

const alphabet = [
	...range(0, 3).map(fontStyleIdx => styledAlphabet.map(line =>
		line.split('').map(char => ({
			char: char,
			style: fontStyleIdx
		}))
	)).flat(1),
	symbolicAlphabet.map(char => ({
		char: char,
		style: FontStyle.REGULAR
	}))
];

const spaceWidth = 5;

export type Word = string | {
	word: string;
	color?: Vec4;
	fontStyle?: FontStyle;
}

export const destructWord = (word: Word) => {
	if (typeof word === 'string') {
		return {
			word: word,
			color: defaultColor,
			fontStyle: defaultFontStyle
		};
	} else {
		return {
			word: word.word,
			color: word.color || defaultColor,
			fontStyle: word.fontStyle || defaultFontStyle
		};
	}
};

export type ColumnSettings = {
	allowStretch?: boolean;
}

export type Table = {
	cells: Paragraph[][];
	columns?: ColumnSettings[];
	paddingBottom?: number;
	borderColor?: Vec4;
}

export type Paragraph = {
	words: Array<Word>;
	align?: HorizontalAlign;
	paddingBottom?: number;
	lineHeight?: number;
	kerning?: number;
}

export const defaultKerning = 1;
export const defaultLineHeight = 0;
export const defaultPaddingBottom = 3;
export const defaultCellPaddingBottom = 0;
export const defaultBorderColor = vec4(0, 0, 0, 0);
export const defaultAllowStretch = true;
export const defaultAlign = HorizontalAlign.LEFT;

export type TextElement = Paragraph | Table;

export type Text = TextElement[]

const defaultTextShadowColor = vec4(0, 0, 0, 0.3);

export class ParagraphLine {
	constructor(
		readonly positions: Vec2[],
		readonly width: number,
	) {
	}
}

export class ParagraphWordsPositions {
	constructor(
		readonly lines: ParagraphLine[],
		readonly width: number,
		readonly height: number
	) {
	}
}

export class TableCellPosition {
	constructor(
		readonly position: Vec2,
		readonly width: number,
		readonly height: number,
		readonly paragraphPositions: ParagraphWordsPositions
	) {
	}
}

export class TableCellsPositions {
	constructor(
		readonly cells: TableCellPosition[][],
		readonly width: number,
		readonly height: number,
		readonly paddingBottom: number = defaultPaddingBottom
	) {
	}
}

export type TextElementPosition = ParagraphWordsPositions | TableCellsPositions;

export class TextElementsPositions {

	constructor(
		readonly positions: TextElementPosition[]
	) {
	}

	readonly width = this.positions.map(p => p.width).reduce((a, b) => Math.max(a, b), 0);
	readonly height = this.positions.map(p => p.height).reduce((a, b) => a + b, 0);

}

export class FontRenderer implements Destroyable, Loadable {

	private readonly fontImage: ImageTexture = new ImageTexture('ui/font/font.png');
	private symbolRectangles = new Map<FontStyle, Map<string, [number, Rect]>>();
	private shader: LoadableShader = new LoadableShader('font');
	lineHeight: number = 0;
	private fontstyleLineHeight = new Map<FontStyle, number>();
	private borderedRect = new BorderedShape([
		vec2(0, 0),
		vec2(1, 0),
		vec2(1, 1),
		vec2(0, 1)
	]);

	load() {
		return Promise.all([
			this.shader.load(),
			this.fontImage.load()
				.then(i => {
					const [lineHeight, lines] = splitImage(i);
					this.lineHeight = lineHeight;
					alphabet.forEach((line, lineIdx) => {
						const style = line[0].style;
						const bounds = lines[lineIdx];
						const maxLineHeight = bounds
							.map((a, idx) => idx === 0 ? 0 : a[4])
							.reduce((a, b) => Math.max(a, b), 0) + 3;
						const old = this.fontstyleLineHeight.get(style) || 0;
						const lh = Math.max(maxLineHeight, old);
						this.fontstyleLineHeight.set(style, lh);
						return line.forEach(
							(v, symbolIdx) => {
								const char = v.char;
								const bound = bounds[symbolIdx];
								if (!bound) {
									throw new Error('WTF? ' + line);
								}
								const args = [
									(bound[0]),
									bound[2],
									(bound[1] + 1),
									bound[2] + lineHeight,
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
		this.borderedRect.destroy();
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
		return [...str].map(s => {
			if (s === ' ') return spaceWidth;
			const sss = this.getSymbol(s, fontStyle);
			if (!sss) {
				throw new Error('Unknown symbol: ' + s);
			}
			return sss[0];
		}).reduce((a, b) => a + b + kerning, 0) - 1;
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
		[...string].forEach(symbol => {
			xx += this.drawSymbol(symbol, xx, y, fontStyle) + kerning;
		});
	}

	drawString(
		text: string, x: number, y: number,
		fontStyle: FontStyle = FontStyle.REGULAR,
		color: Vec4 = vec4(0, 0, 0, 1),
		align: HorizontalAlign = HorizontalAlign.LEFT,
		kerning = 1.0,
		shadowStyle: ShadowStyle = ShadowStyle.NO,
		shadowColor: Vec4 = defaultTextShadowColor
	) {
		this.shader.useProgram();
		this.shader.setTexture('texture', this.fontImage);
		const yy = Math.floor(y);
		this.shader.setVec4('color', shadowStyle === ShadowStyle.NO ? color : shadowColor);
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
			this.shader.setVec4('color', color);
		}
		this.doDrawString(text, x, yy, kerning, fontStyle, align);
	}

	getParagraphTextPositions(
		text: Paragraph,
		width: number,
	): ParagraphWordsPositions {
		const kerning = text.kerning || defaultKerning;
		const sw = spaceWidth * kerning;
		let xx = 0;
		let yy = 0;
		let maxxx = 0;
		let maxLineHeight = 0;
		const lines: ParagraphLine[] = [];
		let line: Vec2[] = [];
		text.words.forEach((ww, idx) => {
			const {
				word, fontStyle
			} = destructWord(ww);
			const w = this.getStringWidth(word, fontStyle);
			const xxIfSameLine = xx + w * kerning + (idx !== 0 ? 0 : 1) * sw;
			if (xxIfSameLine > width) {
				lines.push(new ParagraphLine(
					line,
					xx
				));
				line = [];
				xx = 0;
				yy += maxLineHeight + (text.lineHeight || defaultLineHeight);
				maxLineHeight = 0;
			} else if (idx !== 0) {
				xx += sw;
			}
			line.push(vec2(xx, yy));
			maxLineHeight = Math.max(this.fontstyleLineHeight.get(fontStyle) || 0, maxLineHeight);
			xx += w * kerning;
			maxxx = Math.max(maxxx, xx);
		});
		if (line.length > 0) {
			lines.push(new ParagraphLine(
				line,
				xx
			));
		}
		return new ParagraphWordsPositions(
			lines,
			maxxx,
			yy + maxLineHeight + (text.paddingBottom !== undefined ? text.paddingBottom : defaultPaddingBottom)
		);
	}

	drawParagraphImpl(
		text: Paragraph,
		x: number, y: number,
		w: number,
		textPositions: ParagraphWordsPositions
	): number {
		const xx = Math.floor(x);
		const yy = Math.floor(y);

		let wordIndex = 0;
		textPositions.lines.forEach(({positions, width}) => {
			positions.forEach(wordsPosition => {
				const align = text.align || defaultAlign;
				let dx = 0;
				if (align === HorizontalAlign.CENTER) {
					dx = (w - width) / 2;
				} else if (align === HorizontalAlign.RIGHT) {
					dx = w - width;
				}
				dx = Math.round(dx);
				const {
					word, fontStyle, color
				} = destructWord(text.words[wordIndex]);
				this.shader.setVec4('color', color || defaultColor);
				this.doDrawString(
					word,
					wordsPosition.x + xx + dx, wordsPosition.y + yy,
					text.kerning || defaultKerning,
					fontStyle || defaultFontStyle,
					HorizontalAlign.LEFT
				);
				wordIndex++;
			});
		});
		return textPositions.height;
	}

	drawParagraph(
		text: Paragraph,
		x: number, y: number, w: number
	): number {
		const textPositions = this.getParagraphTextPositions(text, w);
		return this.drawParagraphImpl(text, x, y, w, textPositions);
	}

	getTableCellsPositions(
		table: Table,
		width: number,
	): TableCellsPositions {
		const positions = new Array<Array<TableCellPosition>>();
		let yy = 0;

		const stupidSizes = table.cells.map(line =>
			line.map(paragraph =>
				paragraph.words.map(w => {
					const {word, fontStyle} = destructWord(w);
					return this.getStringWidth(word, fontStyle);
				}).reduce((a, b) => a + b, 0)
			)
		);
		const columnsSizes = range(0, table.cells[0].length - 1).map(columnIdx => {
			return range(0, table.cells.length - 1).map(rowIdx =>
				stupidSizes[rowIdx][columnIdx]
			).reduce((a, b) => Math.max(a, b), 0) + 2;
		});

		const isColumnStretchable = (idx: number) => {
			if (!table.columns) return defaultAllowStretch;
			const a = table.columns[idx].allowStretch;
			if (a === undefined) return defaultKerning;
			return a;
		};


		const fixedSizes = columnsSizes.map((s, idx) =>
			isColumnStretchable(idx) ? 0 : s
		).reduce((a, b) => a + b);
		const dymamicSizes = columnsSizes.map((s, idx) =>
			isColumnStretchable(idx) ? s : 0
		).reduce((a, b) => a + b);
		const w = width - table.cells[0].length * 4;
		const redistribute = w - fixedSizes;
		columnsSizes.forEach((v, idx) => {
			if (isColumnStretchable(idx)) {
				columnsSizes[idx] = v * redistribute / dymamicSizes;
			}
		});

		table.cells.forEach(line => {
			let xx = 0;
			let maxCellHeight = 0;
			const l = new Array<TableCellPosition>();
			line.forEach((cell, cellIdx) => {
				const cellWidth = columnsSizes[cellIdx];
				const paragraphSize = this.getParagraphTextPositions(
					cell,
					cellWidth
				);
				l.push(new TableCellPosition(
					vec2(xx, yy),
					cellWidth,
					paragraphSize.height,
					paragraphSize
				));
				const cellPaddingBottom = cell.paddingBottom === undefined ? defaultCellPaddingBottom : cell.paddingBottom;
				maxCellHeight = Math.max(paragraphSize.height, maxCellHeight + cellPaddingBottom);
				xx += cellWidth + 4;
			});
			positions.push(l.map(p => new TableCellPosition(
				p.position,
				p.width,
				maxCellHeight,
				p.paragraphPositions
			)));
			yy += maxCellHeight + 1;
		});
		const paddingBottom = table.paddingBottom !== undefined ? table.paddingBottom : defaultPaddingBottom;
		return new TableCellsPositions(
			positions,
			width,
			yy + 1 + paddingBottom,
			paddingBottom
		);
	}

	drawTableImpl(
		table: Table,
		x: number, y: number,
		positions: TableCellsPositions
	): number {
		coloredShader.useProgram();
		coloredShader.setVec4('fillColor', table.borderColor || defaultBorderColor);
		coloredShader.setNumber('borderWidth', 0);
		coloredShader.setModel('vertexPosition', this.borderedRect);
		coloredShader.draw(vec2(x, y), vec2(positions.width, positions.height - positions.paddingBottom));
		coloredShader.setVec4('fillColor', vec4(1, 1, 1, 1));

		table.cells.forEach((line, lineIdx) => line.forEach((cell, cellIdx) => {
			const pos = positions.cells[lineIdx][cellIdx];
			const px = Math.round(x + pos.position.x + 1);
			const py = Math.round(y + pos.position.y + 1);
			let dw = 3;
			if (cellIdx + 1 === line.length) {
				dw--;
			}
			coloredShader.draw(vec2(px, py), vec2(pos.width + dw, pos.height));
		}));

		this.shader.useProgram();
		this.shader.setTexture('texture', this.fontImage);
		table.cells.forEach((line, lineIdx) => line.forEach((cell, cellIdx) => {
			const pos = positions.cells[lineIdx][cellIdx].position;
			const px = Math.round(x + pos.x + 2);
			const py = Math.round(y + pos.y + 2);
			this.drawParagraphImpl(
				cell,
				px,
				py,
				positions.cells[lineIdx][cellIdx].width,
				positions.cells[lineIdx][cellIdx].paragraphPositions,
			);
		}));
		return positions.height;
	}

	drawTable(
		table: Table,
		x: number, y: number, w: number,
	): number {
		const positions = this.getTableCellsPositions(
			table, w
		);
		return this.drawTableImpl(table, x, y, positions);
	}

	getTextElementsPositions(
		text: Text,
		w: number
	): TextElementsPositions {
		return new TextElementsPositions(
			text.map(e => {
				if ('words' in e) {
					return this.getParagraphTextPositions(e, w);
				}
				if ('cells' in e) {
					return this.getTableCellsPositions(e, w);
				}
				throw new Error('Unknown case');
			})
		);
	}

	drawTextImpl(
		text: Text,
		x: number, y: number, w: number,
		positions: TextElementsPositions
	) {
		this.shader.useProgram();
		this.shader.setTexture('texture', this.fontImage);
		const xx = Math.floor(x);
		let yy = Math.floor(y);
		text.forEach((e, idx) => {
			if ('words' in e) {
				yy += this.drawParagraphImpl(
					e,
					xx,
					yy,
					w,
					positions.positions[idx] as ParagraphWordsPositions
				);
			}
			if ('cells' in e) {
				yy += this.drawTableImpl(
					e,
					xx,
					yy,
					positions.positions[idx] as TableCellsPositions
				);
			}
		});
	}

	drawText(
		text: Text,
		x: number, y: number, w: number,
	) {
		const positions = this.getTextElementsPositions(
			text, w
		);
		this.drawTextImpl(text, x, y, w, positions);
	}

}

const text: Text = [
	{
		words: [
			{
				word: 'Hello world!',
				color: Colors.BLACK,
				fontStyle: FontStyle.BOLD
			}
		],
		align: HorizontalAlign.CENTER
	},
	{
		words: [
			{
				word: 'Lorem Ipsum',
				color: Colors.RED,
			},
			...'is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.'.split(' ')
		],
	},
	{
		cells: [
			[
				{words: ['1']},
				{words: ['Lorem']},
				{words: ['10.33'], align: HorizontalAlign.RIGHT},
			],
			[
				{words: ['2']},
				{words: ['Ipsum']},
				{words: ['1337.00'], align: HorizontalAlign.RIGHT},
			],
			[
				{words: ['3']},
				{words: ['Dolor']},
				{words: ['N/A'], align: HorizontalAlign.RIGHT},
			]
		],
		borderColor: vec4(0, 0, 0, 1)
	},
	{
		words: 'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source.'.split(' ').map(w => ({
			word: w,
			color: Colors.BLACK,
			fontStyle: FontStyle.SMALL_ITALIC,
		}))
	}
];

export class FontDemoScene implements Scene {
	name = 'FontDemoScene';

	destroy() {
		//
	}

	load(): Promise<any> {
		return Promise.resolve(undefined);
	}

	render() {
		fontRenderer.drawText(
			text,
			-160,
			-90,
			300
		);
	}

	update() {
		//
	}
}
