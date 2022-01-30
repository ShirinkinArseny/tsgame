import {Scene} from '../../scene';
import {CharacterCalmState, GameField} from '../../logic/gameField';
import {BorderedShape} from '../shapes/borderedShape';
import {FieldNode} from '../../logic/field/fieldNode';
import {identity, ortho, reverse} from '../utils/matrices';
import {Rect} from '../shapes/rect';
import {isPointInConvexShape} from '../utils/geom';
import {ImageTexture} from '../textures/imageTexture';
import {range} from '../utils/lists';
import {buildText, FontStyle, HorizontalAlign, ShadowStyle} from '../fontRenderer';
import {hpbar} from './hpbar';
import {Character} from '../../logic/character';
import {error} from '../utils/errors';
import {
	coloredShader,
	defaultRect,
	fontRenderer, frameRenderer, panelRenderer,
	texturedShader
} from '../../sharedResources';
import {TextureMap} from '../textureMap';
import {Mat4, Vec2, vec2, Vec4, vec4} from '../utils/vector';
import {PointerEvent} from '../../events';
import {ButtonRow} from '../buttonRenderer';
import {fh, fw} from '../../globalContext';


const screenRect = {
	bottom: fh / 2,
	top: -fh / 2,
	left: -fw / 2,
	right: fw / 2,
};


export class GameFieldScene implements Scene {

	name: string = 'GameField';
	nodeToShapeMap: Map<FieldNode, BorderedShape> = new Map<FieldNode, BorderedShape>();
	rect: Rect = new Rect(
		-16, -26,
		16, 6
	);
	hoveredNode: FieldNode | undefined;
	pxToScreen: Mat4 = identity();
	screenToPx: Mat4 = identity();
	spacedude = new TextureMap('characters/spacedude/spacedude');
	giraffe = new TextureMap('characters/giraffe/giraffe');
	icons: ImageTexture = new ImageTexture('ui/icons/icons.png');
	iconRects: Rect[] = range(0, 3).map(idx => new Rect(idx / 4, 0, (idx + 1) / 4, 1 / 4));
	pointer: Vec4 = vec4();
	selectedCharacter: Character | undefined;
	pathToMove: FieldNode[] = [];
	isNodeInPathToMove = new Map<FieldNode, boolean>();

	buttonsRow1 = new ButtonRow(
		[
			{
				title: 'Inventory',
				onClick: () => {
					console.log('AAA');
					this.gameField.turnQueue.startNextTurn();
				},
				tooltip: buildText('Hello world!')
			},
			{
				title: 'Stats',
				onClick: () => {
					console.log('BBB');
				},
				tooltip: buildText('Lorem ipsum dolor sit amet')
			},
			{
				title: 'Map',
				onClick: () => {
					console.log('CCC');
				},
				tooltip: buildText('В лесу родилась ёлочка,\nв лесу она росла,\nзимой и летом стройная\nзелёная была.')
			},
			{
				title: 'Menu',
				onClick: () => {
					console.log('DDD');
				},
				tooltip: buildText('Go to main menu')
			}
		],
		-fw / 2 + 95,
		fh / 2 - 17
	);
	buttonsRow2 = new ButtonRow(
		[
			{
				title: 'Attack',
				onClick: () => {
					console.log('AAA');
					this.gameField.turnQueue.startNextTurn();
				},
				tooltip: buildText('Hello world!')
			},
			{
				title: 'Move',
				onClick: () => {
					console.log('BBB');
				},
				tooltip: buildText('Lorem ipsum dolor sit amet')
			},
			{
				title: 'Surrender',
				onClick: () => {
					console.log('CCC');
				},
				tooltip: buildText('В лесу родилась ёлочка,\nв лесу она росла,\nзимой и летом стройная\nзелёная была.')
			}
		],
		-fw / 2 + 95,
		fh / 2 - 34
	);

	private selectedNode() {
		return this.selectedCharacter && this.gameField.getCharacterState(this.selectedCharacter).node;
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
			this.icons.load(),
			this.portraits.load(),
		]);
	}

	destroy() {
		Array.of(...this.nodeToShapeMap.values()).forEach(v => v.destroy());
		this.spacedude.destroy();
		this.giraffe.destroy();
		this.icons.destroy();
		this.iconRects.forEach(r => r.destroy());
	}

	private getCharacterSprite(character: Character): TextureMap {
		if (character.type === 'giraffe') {
			return this.giraffe;
		}
		if (character.type === 'spacedude') {
			return this.spacedude;
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
			return 'Idle';
		case 'CharacterMovingState': {
			const a = state.from.center.xyzw.times(this.pxToScreen);
			const b = state.to.center.xyzw.times(this.pxToScreen);
			return a[0] > b[0] ? 'MoveLeft' : 'MoveRight';
		}
		}
	}

	private drawShape(node: FieldNode, fillColor: Vec4 = vec4(0.8, 0.8, 0.8, 1), borderColor: Vec4 = vec4(1, 1, 1, 1)) {
		const shape = this.nodeToShapeMap.get(node) || error('No shape for this node found');
		const isSelectedNode = this.selectedNode() === node;
		const characterState = this.selectedCharacter && this.gameField.getCharacterState(this.selectedCharacter);
		if (isSelectedNode && characterState instanceof CharacterCalmState) {
			coloredShader.setVec4('borderColor', vec4(0, 0, 0, 1));
			coloredShader.setNumber('borderWidth', 3);
		} else {
			coloredShader.setVec4('borderColor', borderColor);
			coloredShader.setNumber('borderWidth', 2);
		}
		if (
			node === this.hoveredNode ||
			characterState instanceof CharacterCalmState && this.pathToMove.length > 0 && this.isNodeInPathToMove.get(node)
		) {
			coloredShader.setVec4('fillColor', vec4(0.6, 0.6, 0.6, 1.0));
		} else {
			coloredShader.setVec4('fillColor', fillColor);
		}
		coloredShader.setModel('vertexPosition', shape);
		coloredShader.draw(vec2(0, 0), vec2(1, 1));
	}

	render(w: number, h: number) {

		this.pxToScreen = ortho(
			-w / 2,
			w / 2,
			-h / 2,
			h / 2,
		);
		this.screenToPx = reverse(this.pxToScreen);

		coloredShader.useProgram();
		coloredShader.setVec2('modelTranslate', vec2(0, 0));
		coloredShader.setVec2('modelScale', vec2(1, 1));
		this.gameField.getNodes().forEach((node) => {
			this.drawShape(node);
		});

		const characters = this.gameField.getCharacters()
			.map((character) => {
				return {
					character: character,
					point: this.getCharacterPosition(character)
				};
			});
		1;
		characters.sort((a, b) => a.point.y - b.point.y);
		characters.forEach(({character, point}) => {
			const sprite = this.getCharacterSprite(character);
			texturedShader.useProgram();
			texturedShader.setTexture('texture', sprite.texture);
			texturedShader.setModel('vertexPosition', this.rect);
			texturedShader.setModel('texturePosition',
				sprite.getRect(this.getCharacterAnimation(character))
			);
			texturedShader.draw(point.xy, vec2(1, 1));
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

		this.drawQueue();

		if (this.selectedCharacter && this.gameField.getCharacterState(this.selectedCharacter) instanceof CharacterCalmState) {
			const node = this.hoveredNode;
			const char = this.gameField.getCharacterAt(node);
			texturedShader.useProgram();
			texturedShader.setTexture('texture', this.icons);
			texturedShader.setModel('vertexPosition', defaultRect);
			if (char) {
				texturedShader.setModel('texturePosition', this.iconRects[1]);
			} else {
				texturedShader.setModel('texturePosition', this.iconRects[0]);
			}
			texturedShader.draw(this.pointer.xy, vec2(32, 32));
		}

		panelRenderer.render();

		this.buttonsRow1.render();
		this.buttonsRow2.render();

		frameRenderer.renderFrame(-fw / 2 + 1, fh / 2 - 49, 32, 32);


	}

	private drawQueue() {
		const textureSize = 16;
		const sprite = this.portraits;
		const queue = this.gameField.turnQueue.getCurrentQueue();
		const startPoint = -(queue.length * textureSize) / 2;
		queue.forEach((ch, i) => {

			texturedShader.useProgram();
			texturedShader.setTexture('texture', sprite.texture);
			texturedShader.setModel('vertexPosition', defaultRect);
			texturedShader.setModel('texturePosition',
				sprite.getRect(ch.type)
			);
			texturedShader.draw(vec2(startPoint + i * textureSize, screenRect.top), vec2(textureSize, textureSize));

		});
	}

	private updatePath() {
		const selectedNode = this.selectedNode();
		if (!selectedNode || !this.hoveredNode) return;
		this.pathToMove = this.gameField.findPath(selectedNode, this.hoveredNode);
		this.isNodeInPathToMove.clear();
		this.pathToMove.forEach((n) => this.isNodeInPathToMove.set(n, true));
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
		if (pointerEvent.isCursorClicked) {
			const newSelectedCharacter = this.gameField.getCharacterAt(this.hoveredNode);
			if (!newSelectedCharacter && this.selectedCharacter && this.hoveredNode) {
				this.gameField.moveCharacter(this.selectedCharacter, this.hoveredNode);
			} else {
				this.selectedCharacter = newSelectedCharacter;
			}
		}
		const cs = this.selectedCharacter && this.gameField.getCharacterState(this.selectedCharacter);
		if (cs instanceof CharacterCalmState) {
			this.updatePath();
		}

	}


}
