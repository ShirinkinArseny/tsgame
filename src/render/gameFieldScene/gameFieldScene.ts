import {Scene} from '../../scene';
import {CharacterCalmState, GameField} from '../../logic/gameField';
import {BorderedShape} from '../shapes/borderedShape';
import {FieldNode} from '../../logic/field/fieldNode';
import {identity, ortho, reverse} from '../utils/matrices';
import {isPointInConvexShape} from '../utils/geom';
import {Column, FontStyle, HorizontalAlign, Paragraph, ShadowStyle, Table, Text, Word} from '../fontRenderer';
import {hpbar} from './hpbar';
import {Character} from '../../logic/character';
import {error} from '../utils/errors';
import {coloredShader, fontRenderer, frameRenderer, panelRenderer, texturedShader} from '../../sharedResources';
import {TextureMap} from '../textureMap';
import {Mat4, Vec2, vec2, Vec4, vec4} from '../utils/vector';
import {PointerButton, PointerEvent} from '../../events';
import {ButtonRow} from '../buttonRenderer';
import {fh, fw} from '../../globalContext';
import {limit} from '../utils/string';
import {Colors} from '../utils/colors';

const lipsum = 'Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s.'.split(' ').map(w => new Word(
	w,
	Colors.BLACK,
	FontStyle.SMALL
));

const cells = [
	['🔪', ' Damage', ':', '10'],
	['🏹', ' Range', ':', '2'],
	['📏', ' Radius', ':', '123']
].map(line => line.map((w, idx) =>
	new Paragraph(
		[new Word(
			w,
			Colors.BLACK,
			(idx === 1) ? FontStyle.BOLD : FontStyle.SMALL
		)],
		idx === 3 ? HorizontalAlign.RIGHT : idx === 2 ? HorizontalAlign.CENTER : HorizontalAlign.LEFT,
		0
	)
));

const text = new Text(
	[
		new Paragraph(
			[
				new Word(
					'Domestic animals',
					Colors.BLACK,
					FontStyle.BOLD,
				)
			],
			HorizontalAlign.LEFT
		),
		new Paragraph(
			lipsum,
			HorizontalAlign.LEFT,
			5
		),
		new Table(
			cells,
			[
				new Column(false),
				new Column(false),
				new Column(true),
				new Column(false),
			],
			8
		),
		new Paragraph(
			[new Word(
				'(Only for rangers)',
				Colors.RED,
				FontStyle.SMALL
			)],
			HorizontalAlign.CENTER
		),
	]
);

export class GameFieldScene implements Scene {

	name: string = 'GameField';
	nodeToShapeMap: Map<FieldNode, BorderedShape> = new Map<FieldNode, BorderedShape>();
	hoveredNode: FieldNode | undefined;
	pxToScreen: Mat4 = identity();
	screenToPx: Mat4 = identity();
	spacedude = new TextureMap('characters/spacedude/spacedude');
	giraffe = new TextureMap('characters/giraffe/giraffe');
	bus = new TextureMap('characters/bus/bus');
	portraits = new TextureMap('characters/portraits/portraits');
	background = new TextureMap('levels/playground/playground');
	pointer: Vec4 = vec4();
	selectedCharacter: Character | undefined;

	buttonsRow1 = new ButtonRow(
		[
			{
				title: 'End turn',
				onClick: () => {
					console.log('AAA');
					this.gameField.startNextTurn();
				},
				tooltip: text
			},
			{
				title: 'Stats',
				onClick: () => {
					console.log('BBB');
				},
				tooltip: text
			},
			{
				title: 'Map',
				onClick: () => {
					console.log('CCC');
				},
				tooltip: text
			},
			{
				title: 'Menu',
				onClick: () => {
					console.log('DDD');
				},
				tooltip: text
			}
		],
		-fw / 2 + 170,
		fh / 2 - 17
	);
	buttonsRow2 = new ButtonRow(
		[
			{
				title: 'Attack',
				onClick: () => {
					console.log('AAA');
				},
				tooltip: text
			},
			{
				title: 'Move',
				onClick: () => {
					console.log('BBB');
				},
				tooltip: text
			},
			{
				title: 'Surrender',
				onClick: () => {
					console.log('CCC');
				},
				tooltip: text
			},
		],
		-fw / 2 + 170,
		fh / 2 - 34
	);

	private selectedNode() {
		return this.selectedCharacter && this.gameField.getCharacterState(this.selectedCharacter).node;
	}

	private turnedNode() {
		return this.gameField.getCharacterState(this.turnedCharacter()).node;
	}

	private turnedCharacter(): Character {
		return this.gameField.turnQueue.getCurrentCharacter();
	}

	private hoveredCharacter(): Character | undefined {
		return this.gameField.getCharacterAt(this.hoveredNode);
	}

	constructor(
		private readonly gameField: GameField
	) {
		gameField.getNodes().forEach(node => {
			const shape = new BorderedShape(node.points);
			this.nodeToShapeMap.set(node, shape);
		});
	}

	load(): Promise<any> {
		return Promise.all([
			this.spacedude.load(),
			this.giraffe.load(),
			this.bus.load(),
			this.portraits.load(),
			this.background.load()
		]);
	}

	destroy() {
		Array.of(...this.nodeToShapeMap.values()).forEach(v => v.destroy());
		this.spacedude.destroy();
		this.giraffe.destroy();
		this.bus.destroy();
		this.portraits.destroy();
		this.background.destroy();
	}

	private getCharacterSprite(character: Character): TextureMap {
		if (character.type === 'giraffe') {
			return this.giraffe;
		}
		if (character.type === 'spacedude') {
			return this.spacedude;
		}
		if (character.type === 'bus') {
			return this.bus;
		}
		throw new Error('Unknown character type: ' + character.type);
	}

	private getCharacterPosition(character: Character): Vec2 {
		const state = this.gameField.getCharacterState(character);
		switch (state.kind) {
		case 'CharacterCalmState':
			return state.node.center;
		case 'CharacterMovingState': {
			const a = state.from.center;
			const b = state.to.center;
			const p = state.phase;
			return vec2(
				a.x * (1 - p) + b.x * p,
				a.y * (1 - p) + b.y * p,
			);
		}
		}
	}

	private getCharacterAnimation(character: Character): string {
		const state = this.gameField.getCharacterState(character);
		switch (state.kind) {
		case 'CharacterCalmState':
			return 'A.Idle';
		case 'CharacterMovingState': {
			const a = state.from.center.xyzw.times(this.pxToScreen);
			const b = state.to.center.xyzw.times(this.pxToScreen);
			return a[0] > b[0] ? 'A.Move.9' : 'A.Move.3';
		}
		}
	}

	render(w: number, h: number) {

		this.pxToScreen = ortho(
			-w / 2,
			w / 2,
			-h / 2,
			h / 2,
		);
		this.screenToPx = reverse(this.pxToScreen);

		this.drawBackground();
		this.drawCells();
		this.drawCharacters();
		this.drawQueue();
		this.drawUI();
		this.drawFpsCounter();
	}

	private lastTime: number = new Date().getTime();
	private averageDiff: number = 17;

	private drawFpsCounter() {
		const now = new Date().getTime();
		const diff = (now - this.lastTime);
		this.lastTime = now;
		this.averageDiff = 0.98 * this.averageDiff + 0.02 * diff;
		fontRenderer.drawString(
			'FPS: ' + limit((1000 / this.averageDiff).toString(), 6, false),
			-fw / 2 + 10,
			-fh / 2 + 2,
			FontStyle.SMALL,
			vec4(1, 1, 1, 1)
		);
	}

	private drawBackground() {
		texturedShader.useProgram();
		texturedShader.setSprite(this.background, 'Background');
		texturedShader.draw(
			vec2(-384 / 2, -384 / 2),
			vec2(384, 384)
		);
	}

	private drawNode(
		node: FieldNode,
		fillColor: Vec4,
		strokeColor: Vec4,
		strokeWidth: number,
		dx: number = 0,
		dy: number = 0
	) {
		coloredShader.setVec4('fillColor', fillColor);
		coloredShader.setVec4('borderColor', strokeColor);
		coloredShader.setNumber('borderWidth', strokeWidth);
		const shape = this.nodeToShapeMap.get(node) || error('No shape for this node found');
		coloredShader.setModel('vertexPosition', shape);
		coloredShader.draw(vec2(dx, dy), vec2(1, 1));
	}

	private drawCells() {
		coloredShader.useProgram();
		coloredShader.setVec2('modelTranslate', vec2(0, 0));
		const fill: Vec4 = vec4(0, 0, 0, 0.015);
		const fillMoveableCell = vec4(0, 0, 0, 0.05);
		const fillPathCell = vec4(0, 0, 0, 0.15);

		const borderSelectedColor: Vec4 = vec4(0, 0, 0, 0.2);
		const borderActiveColor: Vec4 = vec4(0, 0.3, 0, 1);
		const border: Vec4 = vec4(0, 0, 0, 0);

		const width = 2;
		const widthSelected = 1.8;


		const selectedNode = this.selectedNode();
		const selectedCharacter = this.selectedCharacter;

		const isNodeInMoveableArea = new Map<FieldNode, boolean>();
		if (selectedNode && this.selectedCharacter === this.turnedCharacter()) {
			this.gameField.getCircleArea(
				selectedNode,
				this.selectedCharacter.movePoints - 1
			).forEach(n => isNodeInMoveableArea.set(n, true));
		}

		const isNodeInPathToMove = new Map<FieldNode, boolean>();
		const pathToMove: FieldNode[] = [];
		if (selectedNode && this.hoveredNode && selectedCharacter) {
			if (selectedNode === this.turnedNode()) {
				pathToMove.push(...this.gameField.findPath(selectedNode, this.hoveredNode));
			}
			while (
				pathToMove.length > 0 &&
				pathToMove.length - 1 > selectedCharacter.movePoints) {
				pathToMove.splice(pathToMove.length - 1, 1);
			}
			pathToMove.forEach((n) => isNodeInPathToMove.set(n, true));
		}

		this.gameField.getNodes().forEach((node) => {
			const isSelectedNode = this.selectedNode() === node;
			const isActiveNode = this.turnedNode() === node;
			const characterState = this.selectedCharacter && this.gameField.getCharacterState(this.selectedCharacter);
			const turnedCharacter = this.turnedCharacter();
			let strokeColor: Vec4;
			let strokeWidth: number;
			const isActive = isActiveNode && this.gameField.getCharacterState(turnedCharacter) instanceof CharacterCalmState;
			const isSelected = isSelectedNode && characterState instanceof CharacterCalmState;
			if (isActive) {
				strokeColor = borderActiveColor;
				strokeWidth = widthSelected;
			} else if (isSelected) {
				strokeColor = borderSelectedColor;
				strokeWidth = widthSelected;
			} else {
				strokeColor = border;
				strokeWidth = width;
			}
			const nodeIsInMoveableArea = characterState instanceof CharacterCalmState && isNodeInMoveableArea.get(node);
			const nodeIsInPath = characterState instanceof CharacterCalmState && pathToMove.length > 0 && isNodeInPathToMove.get(node);
			let fillColor: Vec4;
			if (nodeIsInPath) {
				fillColor = fillPathCell;
			} else if (nodeIsInMoveableArea) {
				fillColor = fillMoveableCell;
			} else {
				fillColor = fill;
			}
			this.drawNode(
				node,
				fillColor,
				strokeColor,
				strokeWidth,
				0,
				0
			);
		});
	}

	private drawCharacters() {
		const characters = this.gameField.getCharacters()
			.map((character) => {
				return {
					character: character,
					point: this.getCharacterPosition(character)
				};
			});
		characters.sort((a, b) => a.point.y - b.point.y);
		characters.forEach(({character, point}) => {
			const sprite = this.getCharacterSprite(character);
			texturedShader.useProgram();
			texturedShader.setSprite(sprite, this.getCharacterAnimation(character));
			texturedShader.draw(vec2(
				point.x - 16,
				point.y - 26
			), vec2(32, 32));
			fontRenderer.drawString(
				character.name + ' ' + hpbar(character.hp, character.maxHp),
				point.x + 16, point.y - 40,
				FontStyle.BOLD,
				vec4(1, 1, 1, 1),
				HorizontalAlign.CENTER,
				1,
				ShadowStyle.STROKE,
				vec4(0, 0, 0, 1),
			);
		});
	}

	private drawUI() {
		this.drawBottomPanel();
		this.drawQueue();
	}

	private drawBottomPanel() {
		panelRenderer.render();

		this.buttonsRow1.render();
		this.buttonsRow2.render();

		this.buttonsRow1.renderTooltipLayer();
		this.buttonsRow2.renderTooltipLayer();

		frameRenderer.renderFrame(-fw / 2 + 1, fh / 2 - 49, 32, 32);

		const selected = this.selectedCharacter;
		if (selected) {
			texturedShader.useProgram();
			texturedShader.setSprite(this.portraits, selected.type);
			texturedShader.draw(
				vec2(-fw / 2 + 17, fh / 2 - 35),
				vec2(16, 16)
			);
			const x1 = -fw / 2 + 55;
			const x2 = -fw / 2 + 110;
			const y1 = fh / 2 - 15;
			const y2 = fh / 2 - 26;
			const ren = (text: string, x: number, y: number,
				fs: FontStyle = FontStyle.SMALL,
				c: Vec4 = vec4(0.8, 0.6, 0.4, 1)
			) => {
				fontRenderer.drawString(
					text,
					x,
					y,
					fs,
					c,
					HorizontalAlign.LEFT,
					1,
					ShadowStyle.DIAGONAL
				);
			};
			ren(
				limit(selected.name, 15),
				x1,
				fh / 2 - 38,
				FontStyle.BOLD,
				vec4(0.92, 0.70, 0.47, 1)
			);
			ren(
				'health: ' + selected.hp + '/' + selected.maxHp,
				x1, y1,
			);
			ren(
				'steps: ' + selected.movePoints + '/' + selected.movePointsPerTurn,
				x1, y2,
			);
			ren(
				'lorem: 3/15',
				x2, y1,
			);
			ren(
				'ipsum: 2/3',
				x2, y2,
			);
		}

	}


	private drawQueue() {
		const textureSize = 16;
		const queue = this.gameField.turnQueue.getCurrentQueue();
		const startPoint = -(queue.length * textureSize) / 2;
		texturedShader.useProgram();
		texturedShader.setTexture('texture', this.portraits);
		queue.forEach((ch, i) => {
			texturedShader.setTexturePosition(
				this.portraits.getRect(ch.type)
			);
			texturedShader.draw(
				vec2(startPoint + i * textureSize, -fh / 2),
				vec2(textureSize, textureSize)
			);
		});
	}

	update(
		dt: number,
		pressedKeyMap: Map<string, boolean>,
		pointerEvent: PointerEvent
	) {
		this.buttonsRow1.update(dt, pressedKeyMap, this.screenToPx, pointerEvent);
		this.buttonsRow2.update(dt, pressedKeyMap, this.screenToPx, pointerEvent);
		const cursor = pointerEvent.xy.xyzw;
		this.pointer = cursor.times(this.screenToPx);
		this.hoveredNode = this.gameField.getNodes().find((node) =>
			isPointInConvexShape(this.pointer.xy, node.points));
		if (pointerEvent.cancelled) return;

		if (pointerEvent.isCursorClicked) {
			const newSelectedCharacter = this.gameField.getCharacterAt(this.hoveredNode);
			if (pointerEvent.button === PointerButton.LEFT) {
				this.selectedCharacter = newSelectedCharacter;
			} else if (pointerEvent.button === PointerButton.RIGHT) {
				if (this.selectedCharacter && this.hoveredNode) {
					if (!newSelectedCharacter) {
						this.gameField.moveCharacter(this.selectedCharacter, this.hoveredNode);
					} else {
						this.gameField.cast(
							this.selectedCharacter,
							this.selectedCharacter.spells[0],
							this.hoveredNode
						);
					}
				}
			}
		}
	}


}
