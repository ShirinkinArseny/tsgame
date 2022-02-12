import {Destroyable} from './utils/destroyable';
import {ImageTexture} from './textures/imageTexture';
import {Rect} from './shapes/rect';
import {splitImage} from '../splitImage';
import {LoadableShader} from './shaders/loadableShader';
import {Loadable} from './utils/loadable';
import {range} from './utils/lists';
import {Vec2, vec2, vec4, Vec4} from './utils/vector';
import {defaultRect} from '../sharedResources';
import {error} from './utils/errors';

export enum FontStyle {
	NORMAL, BOLD, SMALL
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
	'abcdefghijklmnopqrstuvwxyz1234567890.,:;=~\'"!$%^?*()[]<>_+-|/\\',
	'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
	'абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
];

const symbolicAlphabet = [
	...'○◐●△◭▲📏🔪🏹',
];

const alphabet = [
	...range(0, 2).map(fontStyleIdx => styledAlphabet.map(line =>
		line.split('').map(char => ({
			char: char,
			style: fontStyleIdx
		}))
	)).flat(1),
	symbolicAlphabet.map(char => ({
		char: char,
		style: FontStyle.NORMAL
	}))
];

const spaceWidth = 4;

export class Word {
	constructor(
		readonly word: string,
		readonly color: Vec4,
		readonly fontStyle: FontStyle,
	) {
	}
}

export const newLine = undefined;

export class Column {
	constructor(
		readonly allowStretch: boolean,
	) {
	}
}

export class Table {
	constructor(
		readonly cells: Paragraph[][],
		readonly columns: Column[] = cells[0].map(() => new Column(
			true,
		)),
		readonly paddingBottom: number = 3
	) {
	}
}

export class Paragraph {
	constructor(
		readonly words: Array<Word>,
		readonly align: HorizontalAlign,
		readonly paddingBottom: number = 3,
		readonly lineHeight: number = 0,
		readonly kerning: number = 1.0
	) {
	}
}

export type TextElement = Paragraph | Table;

export class Text {
	constructor(readonly elements: TextElement[]) {
	}
}

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
		readonly paddingBottom: number
	) {
	}

	readonly width = this.cells[0].map(w => w.width).reduce((a, b) => a + b, 0);
	readonly height = this.cells.map(w => w[0].height).reduce((a, b) => a + b, 0) + this.paddingBottom;
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
							.map(([x0, x1, y0, y1, h], idx) => idx === 0 ? 0 : h)
							.reduce((a, b) => Math.max(a, b), 0) + 3;
						const old = this.fontstyleLineHeight.get(style) || 0;
						const lh = Math.max(maxLineHeight, old);
						this.fontstyleLineHeight.set(style, lh);
						return line.forEach(
							(v, symbolIdx) => {
								const char = v.char;
								const bound = bounds[symbolIdx];
								if (!bound) {
									throw new Error('WTF?');
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
		[...string].forEach(symbol => {
			xx += this.drawSymbol(symbol, xx, y, fontStyle) + kerning;
		});
	}

	private initRenderingText() {
		this.shader.useProgram();
		this.shader.setTexture('texture', this.fontImage);
	}

	drawString(
		text: string, x: number, y: number,
		fontStyle: FontStyle = FontStyle.NORMAL,
		color: Vec4 = vec4(0, 0, 0, 1),
		align: HorizontalAlign = HorizontalAlign.LEFT,
		kerning = 1.0,
		shadowStyle: ShadowStyle = ShadowStyle.NO,
		shadowColor: Vec4 = defaultTextShadowColor
	) {
		const yy = Math.floor(y);
		this.initRenderingText();
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
		const sw = spaceWidth * text.kerning;
		let xx = 0;
		let yy = 0;
		let maxxx = 0;
		let maxLineHeight = 0;
		const lines: ParagraphLine[] = [];
		let line: Vec2[] = [];
		text.words.forEach((word, idx) => {
			const w = this.getStringWidth(word.word, word.fontStyle);
			const xxIfSameLine = xx + w * text.kerning + (idx !== 0 ? 0 : 1) * sw;
			if (xxIfSameLine > width) {
				lines.push(new ParagraphLine(
					line,
					xx
				));
				line = [];
				xx = 0;
				yy += maxLineHeight + text.lineHeight;
				maxLineHeight = 0;
			} else if (idx !== 0) {
				xx += sw;
			}
			line.push(vec2(xx, yy));
			maxLineHeight = Math.max(this.fontstyleLineHeight.get(word.fontStyle) || 0, maxLineHeight);
			xx += w * text.kerning;
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
			yy + maxLineHeight + text.paddingBottom
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
		this.initRenderingText();

		let wordIndex = 0;
		textPositions.lines.forEach(({positions, width}) => {
			positions.forEach(wordsPosition => {
				let dx = 0;
				if (text.align === HorizontalAlign.CENTER) {
					dx = (w - width) / 2;
				} else if (text.align === HorizontalAlign.RIGHT) {
					dx = w - width;
				}
				dx = Math.round(dx);
				const textElement = text.words[wordIndex];
				this.shader.setVec4('color', textElement.color);
				this.doDrawString(
					textElement.word,
					wordsPosition.x + xx + dx, wordsPosition.y + yy,
					text.kerning,
					textElement.fontStyle,
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
		w: number,
	): TableCellsPositions {
		const positions = new Array<Array<TableCellPosition>>();
		let yy = 0;

		const stupidSizes = table.cells.map(line =>
			line.map(paragraph =>
				paragraph.words.map(word =>
					this.getStringWidth(word.word, word.fontStyle) + spaceWidth
				).reduce((a, b) => a + b, 0)
			)
		);
		const columnsSizes = range(0, table.cells[0].length - 1).map(columnIdx => {
			return range(0, table.cells.length - 1).map(rowIdx =>
				stupidSizes[rowIdx][columnIdx]
			).reduce((a, b) => Math.max(a, b), 0);
		});

		const fixedSizes = columnsSizes.map((s, idx) =>
			table.columns[idx].allowStretch ? 0 : s
		).reduce((a, b) => a + b);
		const dymamicSizes = columnsSizes.map((s, idx) =>
			table.columns[idx].allowStretch ? s : 0
		).reduce((a, b) => a + b);
		const redistribute = w - fixedSizes;
		columnsSizes.forEach((v, idx) => {
			if (table.columns[idx].allowStretch) {
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
				maxCellHeight = Math.max(paragraphSize.height, maxCellHeight);
				xx += cellWidth;
			});
			positions.push(l);
			yy += maxCellHeight;
		});
		return new TableCellsPositions(positions, table.paddingBottom);
	}

	drawTableImpl(
		table: Table,
		x: number, y: number,
		positions: TableCellsPositions
	): number {
		table.cells.forEach((line, lineIdx) => line.forEach((cell, cellIdx) => {
			const px = Math.round(x + positions.cells[lineIdx][cellIdx].position.x);
			const py = Math.round(y + positions.cells[lineIdx][cellIdx].position.y);
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
			text.elements.map(e => {
				if (e instanceof Paragraph) {
					return this.getParagraphTextPositions(e, w);
				}
				if (e instanceof Table) {
					return this.getTableCellsPositions(e, w);
				}
				return error('Unknown element type: ' + e);
			})
		);
	}

	drawTextImpl(
		text: Text,
		x: number, y: number, w: number,
		positions: TextElementsPositions
	) {
		const xx = Math.floor(x);
		let yy = Math.floor(y);
		text.elements.forEach((e, idx) => {
			if (e instanceof Paragraph) {
				yy += this.drawParagraphImpl(
					e,
					xx,
					yy,
					w,
					positions.positions[idx] as ParagraphWordsPositions
				);
			} else if (e instanceof Table) {
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
