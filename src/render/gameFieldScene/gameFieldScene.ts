import {Scene} from '../../scene';
import {CharacterCalmState, GameField} from '../../logic/gameField';
import {BorderedShape} from '../shapes/borderedShape';
import {FieldNode} from '../../logic/field/fieldNode';
import {identity, ortho, reverse} from '../utils/matrices';
import {isPointInConvexShape} from '../utils/geom';
import {FontStyle, HorizontalAlign, ShadowStyle, Text} from '../fontRenderer';
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
import {Spell, spells} from '../../logic/spell';

const text: Text = [
	{
		words: [
			{
				word: 'Domestic animals',
				fontStyle: FontStyle.BOLD,
			}
		]
	},
	{
		words: 'Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s.'.split(' ').map(w => ({
			word: w,
			fontStyle: FontStyle.SMALL
		})),
		paddingBottom: 5
	},
	{
		cells: [
			['🔪', ' Damage', ':', '10'],
			['🏹', ' Range', ':', '2'],
			['📏', ' Radius', ':', '123']
		].map(line => line.map((w, idx) => ({
			type: 'paragraph',
			words: [
				{
					word: w,
					fontStyle: (idx === 1) ? FontStyle.BOLD : FontStyle.SMALL
				}
			],
			align: idx === 3 ? HorizontalAlign.RIGHT : idx === 2 ? HorizontalAlign.CENTER : HorizontalAlign.LEFT,
			paddingBottom: 0
		}))),
		columns: [
			{allowStretch: false},
			{allowStretch: false},
			{allowStretch: true},
			{allowStretch: false},
		],
		paddingBottom: 8
	},
	{
		words: [
			{
				word: '(Only for rangers)',
				color: Colors.RED,
				fontStyle: FontStyle.SMALL
			}
		],
		align: HorizontalAlign.CENTER
	}
];

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
	spellsIcons = new TextureMap('ui/spells/spells');
	pointer: Vec4 = vec4();
	selectedCharacter: Character | undefined;
	selectedSpell: Spell | undefined;

	buttonsRow1 = new ButtonRow(
		[
			{
				title: 'Inventory',
				onClick: () => {
					console.log('BBB');
				},
				tooltip: text
			},
			{
				title: 'Spellbook',
				onClick: () => {
					console.log('CCC');
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
				title: 'Log',
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
		spells
			.map(spell => ({
				sprite: this.spellsIcons,
				tag: spell.title,
				onClick: () => {
					if (this.selectedCharacter) {
						if (spell.castEffectWithoutTarget) {
							if (spell.isAllowed(
								this.gameField,
								this.selectedCharacter
							)) {
								this.selectedSpell = undefined;
								spell.castEffectWithoutTarget(
									this.gameField,
									this.selectedCharacter,
								);
							}
						} else {
							this.selectedSpell = spell;
						}
					}
				},
				tooltip: spell.description,
				isSelected: () => this.selectedSpell === spell
			}))
		,
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
			this.background.load(),
			this.spellsIcons.load()
		]);
	}

	destroy() {
		Array.of(...this.nodeToShapeMap.values()).forEach(v => v.destroy());
		this.spacedude.destroy();
		this.giraffe.destroy();
		this.bus.destroy();
		this.portraits.destroy();
		this.background.destroy();
		this.spellsIcons.destroy();
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

	render() {

		this.pxToScreen = ortho(
			-fw / 2,
			fw / 2,
			-fh / 2,
			fh / 2,
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
		const fillAllowedCell = vec4(0, 0, 0, 0.05);
		const fillAffectedCell = vec4(0, 0, 0, 0.15);

		const borderActiveSelectedColor: Vec4 = vec4(0, 0.4, 0, 1);
		const borderSelectedColor: Vec4 = vec4(0, 0, 0, 0.2);
		const borderActiveColor: Vec4 = vec4(0, 0.3, 0, 0.4);
		const border: Vec4 = vec4(0, 0, 0, 0);

		const width = 2;
		const widthActiveSelected = 4;
		const widthSelected = 1.8;

		const isNodeInAllowedArea = new Map<FieldNode, boolean>();
		if (
			this.selectedSpell &&
			this.selectedCharacter &&
			this.selectedSpell.getAllowedNodes
		) {
			this.selectedSpell.getAllowedNodes(
				this.gameField,
				this.selectedCharacter,
			).forEach(n => isNodeInAllowedArea.set(n, true));
		}

		const isNodeInAffectedArea = new Map<FieldNode, boolean>();
		if (
			this.selectedSpell &&
			this.selectedCharacter &&
			this.hoveredNode &&
			isNodeInAllowedArea.get(this.hoveredNode) &&
			this.selectedSpell.getAffectedNodes
		) {
			this.selectedSpell.getAffectedNodes(
				this.gameField,
				this.selectedCharacter,
				this.hoveredNode
			).forEach((n) => isNodeInAffectedArea.set(n, true));
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
			if (isActive && isSelected) {
				strokeColor = borderActiveSelectedColor;
				strokeWidth = widthActiveSelected;
			} else if (isActive) {
				strokeColor = borderActiveColor;
				strokeWidth = widthSelected;
			} else if (isSelected) {
				strokeColor = borderSelectedColor;
				strokeWidth = widthSelected;
			} else {
				strokeColor = border;
				strokeWidth = width;
			}
			const nodeIsInAllowedArea = characterState instanceof CharacterCalmState && isNodeInAllowedArea.get(node);
			const nodeIsInAffectedArea = characterState instanceof CharacterCalmState && isNodeInAffectedArea.get(node);
			let fillColor: Vec4;
			if (nodeIsInAffectedArea) {
				fillColor = fillAffectedCell;
			} else if (nodeIsInAllowedArea) {
				fillColor = fillAllowedCell;
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
		if (this.selectedCharacter === this.turnedCharacter()) {
			this.buttonsRow2.render();
		}

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
		const hoveredNode = this.gameField.getNodes().find((node) =>
			isPointInConvexShape(this.pointer.xy, node.points));
		this.hoveredNode = hoveredNode;
		if (pointerEvent.cancelled) return;

		if (pointerEvent.isCursorClicked) {

			if (pointerEvent.button == PointerButton.RIGHT) {
				this.selectedSpell = undefined;
				this.selectedCharacter = undefined;
			} else {
				if (this.selectedCharacter === undefined || this.selectedSpell === undefined) {
					const hoveredCharacter = this.gameField.getCharacterAt(this.hoveredNode);
					if (pointerEvent.button === PointerButton.LEFT) {
						this.selectedCharacter = hoveredCharacter;
						if (this.selectedCharacter !== this.turnedCharacter()) {
							this.selectedSpell = undefined;
						}
					}
				} else if (
					pointerEvent.button === PointerButton.LEFT &&
					hoveredNode &&
					this.selectedCharacter &&
					this.selectedCharacter === this.turnedCharacter() &&
					this.selectedSpell.isAllowed(
						this.gameField,
						this.selectedCharacter
					) &&
					this.selectedSpell.castEffectWithTarget
				) {
					this.selectedSpell.castEffectWithTarget(
						this.gameField,
						this.selectedCharacter,
						hoveredNode
					);
				}
			}
		}
	}


}
