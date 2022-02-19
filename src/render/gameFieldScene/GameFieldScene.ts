import {Scene} from '../../Scene';
import {BorderedShape} from '../shapes/BorderedShape';
import {FieldNode} from '../../logic/field/FieldNode';
import {isPointInConvexShape} from '../utils/Geom';
import {FontStyle, HorizontalAlign, ShadowStyle, Text} from '../FontRenderer';
import {Character} from '../../logic/Character';
import {error} from '../utils/Errors';
import {
	coloredShader,
	fontRenderer,
	frameRenderer,
	panelRenderer, portraits,
	texturedShader
} from '../../SharedResources';
import {Animation, TextureMap} from '../TextureMap';
import {Vec2, vec2, Vec4, vec4} from '../utils/Vector';
import {PointerButton, PointerEvent} from '../../Events';
import {ButtonRow} from '../ButtonRenderer';
import {fh, fw} from '../../GlobalContext';
import {limit} from '../utils/String';
import {Spell, spells} from '../../logic/spells/_Spell';
import {WorldClient} from '../../logic/world/WorldClient';
import {CharacterCalmState} from '../../logic/world/CharacterState';
import {teams} from '../../constants';
import {pointerLayer} from '../PointerLayer';
import {tooltipLayer} from '../TooltipLayer';
import {TooltippedIcons} from '../IconsRow';
import {QueueRenderer} from '../QueueRenderer';


const text: Text = [
	{
		words: [
			{
				word: 'Do stuff',
				fontStyle: FontStyle.SMALL,
			}
		]
	},
];

export class GameFieldScene implements Scene {

	name: string = 'GameField';
	nodeToShapeMap: Map<FieldNode, BorderedShape> = new Map<FieldNode, BorderedShape>();
	hoveredNode: FieldNode | undefined;
	spacedude = new TextureMap('characters/spacedude/spacedude');
	giraffe = new TextureMap('characters/giraffe/giraffe');
	bus = new TextureMap('characters/bus/bus');
	background = new TextureMap('levels/playground/playground');
	spellIcons = new TextureMap('ui/spellIcons/spellIcons');
	spellAnimation = new TextureMap('spellAnimation/spellAnimation');
	effectIcons = new TextureMap('ui/effectIcons/effectIcons');
	pointer: Vec2 = vec2();
	selectedCharacter: Character | undefined;
	selectedSpell: Spell | undefined;
	animations = new Map<FieldNode, Animation[]>();
	queueRenderer: QueueRenderer = new QueueRenderer(
		(c) => {
			this.selectedCharacter = c;
		}
	);


	effectsRow = new TooltippedIcons(
		() => {
			if (!this.selectedCharacter) return [];
			return this.selectedCharacter.effects.map(e => ({
				icon: e.effect.title,
				tooltip: e.effect.description
			}));
		},
		-fw / 2 + 54,
		fh / 2 - 13,
		this.effectIcons
	);

	load(): Promise<any> {
		return Promise.all([
			this.spacedude.load(),
			this.giraffe.load(),
			this.bus.load(),
			this.background.load(),
			this.spellIcons.load(),
			this.spellAnimation.load(),
			this.effectIcons.load(),
			this.queueRenderer.load()
		]);
	}

	destroy() {
		Array.of(...this.nodeToShapeMap.values()).forEach(v => v.destroy());
		this.spacedude.destroy();
		this.giraffe.destroy();
		this.bus.destroy();
		this.background.destroy();
		this.spellIcons.destroy();
		this.spellAnimation.destroy();
		this.effectIcons.destroy();
		this.queueRenderer.destroy();
	}

	buttonsRow1 = new ButtonRow(
		() => [
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
		() => {
			if (!this.isSelectedCharActionable()) return [];
			return spells.map(spell => ({
				sprite: this.spellIcons,
				tag: spell.title,
				onClick: () => {
					if (this.selectedCharacter) {
						if (spell.castEffectWithoutTarget) {
							if (spell.isAllowed(
								this.world,
								this.selectedCharacter
							)) {
								this.selectedSpell = undefined;
								this.world.castSpell(spell);
							}
						} else {
							this.selectedSpell = spell;
						}
					}
				},
				tooltip: spell.description,
				isSelected: () => this.selectedSpell === spell,
				isDisabled: () => !this.selectedCharacter || !spell.isAllowed(
					this.world,
					this.selectedCharacter
				)
			}));
		},
		-fw / 2 + 170,
		fh / 2 - 34
	);

	private selectedNode() {
		return this.selectedCharacter && this.world.getCharacterState(this.selectedCharacter).node;
	}

	private turnedNode() {
		return this.world.getCharacterState(this.turnedCharacter()).node;
	}

	private turnedCharacter(): Character {
		return this.world.getTurnQueue()[0];
	}

	private hoveredCharacter(): Character | undefined {
		return this.world.getCharacterAt(this.hoveredNode);
	}

	constructor(
		private readonly world: WorldClient
	) {
		world.getNodes().forEach(node => {
			const shape = new BorderedShape(node.points);
			this.nodeToShapeMap.set(node, shape);
		});
		world.addSpellListener((
			spell, author, target
		) => {
			spell.draw && spell.draw(
				this.world,
				author,
				target,
				this.castVisualEffect
			);
		});
		world.addQueueListener(() => {
			this.selectedCharacter = world.getTurnQueue()[0];
		});
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
		const state = this.world.getCharacterState(character);
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
		const state = this.world.getCharacterState(character);
		switch (state.kind) {
		case 'CharacterCalmState':
			return 'A.Idle';
		case 'CharacterMovingState': {
			const a = state.from.center;
			const b = state.to.center;
			return a[0] > b[0] ? 'A.Move.9' : 'A.Move.3';
		}
		}
	}

	private preRender() {
		if (this.selectedCharacter && this.selectedCharacter.hp <= 0) {
			this.selectedCharacter = undefined;
		}
		pointerLayer.reset();
	}

	render() {
		this.preRender();
		this.drawBackground();
		this.drawCells();
		this.drawCellEffects();
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
				this.world,
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
				this.world,
				this.selectedCharacter,
				this.hoveredNode
			).forEach((n) => isNodeInAffectedArea.set(n, true));
		}

		this.world.getNodes().forEach((node) => {
			const isSelectedNode = this.selectedNode() === node;
			const isActiveNode = this.turnedNode() === node;
			const characterState = this.selectedCharacter && this.world.getCharacterState(this.selectedCharacter);
			const turnedCharacter = this.turnedCharacter();
			let strokeColor: Vec4;
			let strokeWidth: number;
			const isActive = isActiveNode && this.world.getCharacterState(turnedCharacter) instanceof CharacterCalmState;
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

	private drawCellEffects() {
		texturedShader.useProgram();
		texturedShader.setTexture('texture', this.spellAnimation);
		this.world.getNodes().forEach((node) => {
			const effects = this.animations.get(node) || [];
			for (let i = 0; i < effects.length; i++) {
				const effect = effects[i];
				const frame = effect.getFrame();
				if (frame) {
					texturedShader.setFrame(frame);
					texturedShader.draw(
						vec2(
							node.center.x - 16,
							node.center.y - 24
						),
						vec2(32, 32)
					);
				} else {
					effects.splice(i, 1);
					i--;
				}
			}
		});
	}

	private drawCharacters() {
		const characters = this.world.getCharacters()
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
		});
	}

	private drawUI() {
		this.drawBottomPanel();
		this.drawQueue();
		tooltipLayer.draw();
	}

	private isSelectedCharActionable() {
		return this.selectedCharacter && this.selectedCharacter === this.turnedCharacter() && this.selectedCharacter.team === teams.ally;
	}

	private drawBottomPanel() {
		panelRenderer.render();

		this.buttonsRow1.draw();
		if (this.isSelectedCharActionable()) {
			this.buttonsRow2.draw();
		}

		const selected = this.selectedCharacter;
		if (selected) {
			frameRenderer.renderFrame(-fw / 2 + 1, fh / 2 - 49, 20, 20);
			texturedShader.useProgram();
			texturedShader.setSprite(portraits, selected.type);
			texturedShader.draw(
				vec2(-fw / 2 + 11, fh / 2 - 40),
				vec2(16, 16)
			);
			fontRenderer.drawString(
				limit(selected.name, 15),
				-fw / 2 + 42,
				fh / 2 - 38,
				FontStyle.BOLD,
				vec4(0.92, 0.70, 0.47, 1),
				HorizontalAlign.LEFT,
				1,
				ShadowStyle.DIAGONAL
			);
			fontRenderer.drawString(
				'❤ ' + selected.hp + '/' + selected.maxHp,
				-fw / 2 + 42,
				fh / 2 - 26,
				FontStyle.SMALL,
				vec4(0.92, 0.70, 0.47, 1),
				HorizontalAlign.LEFT,
				1,
				ShadowStyle.DIAGONAL
			);
			fontRenderer.drawString(
				'🕐 ' + selected.actionPoints + '/' + selected.actionPointsPerTurn,
				-fw / 2 + 82,
				fh / 2 - 26,
				FontStyle.SMALL,
				vec4(0.92, 0.70, 0.47, 1),
				HorizontalAlign.LEFT,
				1,
				ShadowStyle.DIAGONAL
			);
			fontRenderer.drawString(
				'🦶 ' + selected.movePoints + '/' + selected.movePointsPerTurn,
				-fw / 2 + 122,
				fh / 2 - 26,
				FontStyle.SMALL,
				vec4(0.92, 0.70, 0.47, 1),
				HorizontalAlign.LEFT,
				1,
				ShadowStyle.DIAGONAL
			);
			fontRenderer.drawString(
				'✨',
				-fw / 2 + 42,
				fh / 2 - 14,
				FontStyle.SMALL,
				vec4(0.92, 0.70, 0.47, 1),
				HorizontalAlign.LEFT,
				1,
				ShadowStyle.DIAGONAL
			);
			this.effectsRow.draw();

		}

	}


	private drawQueue() {
		const queue = this.world.getTurnQueue();
		this.queueRenderer.draw(queue);
	}

	update(
		pressedKeyMap: Map<string, boolean>,
		pointerEvent: PointerEvent
	) {

		pointerLayer.update(pointerEvent);
		if (pointerEvent.cancelled) return;

		this.pointer = pointerEvent.xy;
		const hoveredNode = this.world.getNodes().find((node) =>
			isPointInConvexShape(this.pointer.xy, node.points));
		this.hoveredNode = hoveredNode;
		if (pointerEvent.cancelled) return;

		if (pointerEvent.isCursorClicked) {

			if (pointerEvent.button == PointerButton.RIGHT) {
				this.selectedSpell = undefined;
				this.selectedCharacter = undefined;
			} else {
				if (this.selectedCharacter === undefined || this.selectedSpell === undefined) {
					const hoveredCharacter = this.world.getCharacterAt(this.hoveredNode);
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
						this.world,
						this.selectedCharacter
					) &&
					this.selectedSpell.castEffectWithTarget
				) {
					this.world.castSpell(
						this.selectedSpell,
						hoveredNode
					);
					this.selectedSpell = undefined;
				}
			}
		}
	}


	castVisualEffect = (node: FieldNode, type: string) => {
		const old = this.animations.get(node) || [];
		old.push(this.spellAnimation.getAnimation(type));
		this.animations.set(node, old);
	};
}
