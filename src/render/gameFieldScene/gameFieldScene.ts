import {Scene} from '../../scene';
import {CharacterCalmState, GameField} from '../../logic/gameField';
import {BorderedShape} from '../shapes/borderedShape';
import {FieldNode} from '../../logic/field/fieldNode';
import {
	identity,
	Mat4,
	multiplyMatToVec,
	ortho,
	reverse,
	rotate,
	scale,
	translate,
	Vec2,
	Vec4
} from '../utils/matrices';
import {Rect} from '../shapes/rect';
import {isPointInConvexShape, toVec4} from '../utils/geom';
import {ImageTexture} from '../textures/imageTexture';
import {range} from '../utils/lists';
import {Align, FontStyle, ShadowStyle} from '../fontRenderer';
import {hpbar} from './hpbar';
import {Character} from '../../logic/character';
import {error} from '../utils/errors';
import {buttonRenderer, coloredShader, defaultRect, fontRenderer, texturedShader} from '../../sharedResources';
import {TextureMap} from '../textureMap';


export class GameFieldScene implements Scene {

	name: string = 'GameField';
	nodeToShapeMap: Map<FieldNode, BorderedShape> = new Map<FieldNode, BorderedShape>();
	rect: Rect = new Rect(
		-16, -26,
		16, 6
		/*, -0.4,
		0.2, 0*/
	);
	hoveredNode: FieldNode | undefined;
	worldToScreen: Mat4 = identity();
	screenToWorld: Mat4 = identity();
	pxToScreen: Mat4 = identity();
	screenToPx: Mat4 = identity();
	spacedude = new TextureMap('characters/spacedude/spacedude');
	icons: ImageTexture = new ImageTexture('ui/icons/icons.png');
	iconRects: Rect[] = range(0, 3).map(idx => new Rect(idx / 4, 0, (idx + 1) / 4, 1 / 4));
	wx: number = 0;
	wy: number = 0;
	x: number = 0;
	y: number = 0;
	px: number = 0;
	py: number = 0;
	selectedCharacter: Character | undefined;
	pathToMove: FieldNode[] = [];
	isNodeInPathToMove = new Map<FieldNode, boolean>();

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
			this.icons.load()
		]);
	}

	destroy() {
		Array.of(...this.nodeToShapeMap.values()).forEach(v => v.destroy());
		this.spacedude.destroy();
		this.icons.destroy();
		this.iconRects.forEach(r => r.destroy());
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
			return [
				a[0] * (1 - p) + b[0] * p,
				a[1] * (1 - p) + b[1] * p,
			];
		}
		}
	}

	private getCharacterAnimation(character: Character): string {
		const state = this.gameField.getCharacterState(character);
		switch (state.kind) {
		case 'CharacterCalmState':
			return 'Idle';
		case 'CharacterMovingState': {
			const a = multiplyMatToVec(this.worldToScreen, toVec4(state.from.center));
			const b = multiplyMatToVec(this.worldToScreen, toVec4(state.to.center));
			return a[0] > b[0] ? 'MoveLeft' : 'MoveRight';
		}
		}
	}

	private drawShape(node: FieldNode, fillColor: Vec4 = [0.8, 0.8, 0.8, 1], borderColor: Vec4 = [1, 1, 1, 1]) {
		const shape = this.nodeToShapeMap.get(node) || error('No shape for this node found');
		const isSelectedNode = this.selectedNode() === node;
		const characterState = this.selectedCharacter && this.gameField.getCharacterState(this.selectedCharacter);
		if (isSelectedNode && characterState instanceof CharacterCalmState) {
			coloredShader.setVector4f('borderColor', [0, 0, 0, 1]);
			coloredShader.set1f('borderWidth', 3);
		} else {
			coloredShader.setVector4f('borderColor', borderColor);
			coloredShader.set1f('borderWidth', 2);
		}
		if (characterState instanceof CharacterCalmState && this.pathToMove.length > 0 && this.isNodeInPathToMove.get(node)) {
			coloredShader.setVector4f('fillColor', [0.6, 0.6, 0.6, 1.0]);
		} else {
			coloredShader.setVector4f('fillColor', fillColor);
		}
		coloredShader.setModel('aVertexPosition', shape);
		coloredShader.draw();
	}

	render(w: number, h: number) {
		const angle = (new Date().getTime() % 60000) / 60000 * Math.PI * 2;
		this.worldToScreen = ortho(-w / 2, w / 2, -h / 2, h / 2, 0.0, 100.0);

		rotate(this.worldToScreen, angle, [0, 0, 1]);
		this.screenToWorld = reverse(this.worldToScreen);
		coloredShader.useProgram();
		coloredShader.setMatrix('projectionMatrix', this.worldToScreen);
		coloredShader.setMatrix('modelMatrix', identity());
		this.gameField.getNodes().forEach((node) => {
			this.drawShape(node);
		});


		this.pxToScreen = ortho(-w / 2, w / 2, -h / 2, h / 2, 0.0, 100.0);
		this.screenToPx = reverse(this.pxToScreen);


		this.gameField.getCharacters()
			.map((character) => {
				let c = toVec4(this.getCharacterPosition(character));
				const rot = rotate(identity(), angle, [0, 0, 1]);
				c = multiplyMatToVec(rot, c) as Vec4;
				return {
					character: character,
					point: c
				};
			})
			.sort((a, b) => a.point[1] - b.point[1])
			.forEach(({character, point}) => {
				texturedShader.useProgram();
				texturedShader.setTexture('texture', this.spacedude.texture);
				texturedShader.setMatrix('projectionMatrix', this.pxToScreen);
				texturedShader.setModel('aVertexPosition', this.rect);
				texturedShader.setModel('aTexturePosition',
					this.spacedude.getRect(this.getCharacterAnimation(character))
				);
				texturedShader.setMatrix(
					'modelMatrix',
					translate(identity(), [point[0], point[1], 0]),
				);
				texturedShader.draw();
				fontRenderer.drawString(
					character.name + ' ' + hpbar(character.hp, character.maxHp),
					point[0] + 16, point[1] - 40,
					FontStyle.BOLD,
					[1, 1, 1, 1],
					this.pxToScreen,
					Align.CENTER,
					1,
					ShadowStyle.STROKE,
					[0, 0, 0, 1],
				);
			});

		if (this.selectedCharacter && this.gameField.getCharacterState(this.selectedCharacter) instanceof CharacterCalmState) {
			const node = this.hoveredNode;
			const char = this.gameField.getCharacterAt(node);
			texturedShader.useProgram();
			texturedShader.setTexture('texture', this.icons);
			texturedShader.setMatrix('projectionMatrix', this.pxToScreen);
			texturedShader.setModel('aVertexPosition', defaultRect);
			if (char) {
				texturedShader.setModel('aTexturePosition', this.iconRects[1]);
			} else {
				texturedShader.setModel('aTexturePosition', this.iconRects[0]);
			}
			texturedShader.setMatrix(
				'modelMatrix',
				scale(translate(identity(), [this.px, this.py, 0]), [32, 32, 0]))
			;
			texturedShader.draw();
		}

		buttonRenderer.renderButtonsRow(
			-120,
			h / 2 - 23,
			this.pxToScreen,
			[
				{
					title: 'Inventory',
					onClick: () => {
						console.log('AAA');
					}
				},
				{
					title: 'Stats',
					onClick: () => {
						console.log('BBB');
					}
				},
				{
					title: 'Map',
					onClick: () => {
						console.log('CCC');
					}
				}
			]
		);


	}

	private updatePath() {
		const selectedNode = this.selectedNode();
		if (!selectedNode || !this.hoveredNode) return;
		this.pathToMove = this.gameField.findPath(selectedNode, this.hoveredNode);
		this.isNodeInPathToMove.clear();
		this.pathToMove.forEach((n) => this.isNodeInPathToMove.set(n, true));
	}

	update(dt: number, pressedKeyMap: Map<string, boolean>, cursorX: number, cursorY: number,
		cursorPressed: boolean,
		cursorClicked: boolean
	) {
		buttonRenderer.update(dt, pressedKeyMap, this.screenToPx, cursorX, cursorY, cursorPressed);
		[this.wx, this.wy] = multiplyMatToVec(this.screenToWorld, [cursorX, cursorY, 0, 1]);
		[this.px, this.py] = multiplyMatToVec(this.screenToPx, [cursorX, cursorY, 0, 1]);
		[this.x, this.y] = [cursorX, cursorY];
		this.hoveredNode = this.gameField.getNodes().find((node) =>
			isPointInConvexShape([this.wx, this.wy], node.points)
		);
		if (cursorClicked) {
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
