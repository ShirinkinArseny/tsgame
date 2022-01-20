import {Scene} from '../../scene';
import {CharacterCalmState, CharacterMovingState, GameField} from '../../logic/gameField';
import {BorderedShape} from '../shapes/borderedShape';
import {FieldNode} from '../../logic/field/fieldNode';
import {identity, Mat4, multiplyMatToVec, ortho, reverse, rotate, translate, Vec2, Vec4} from '../utils/matrices';
import {Rect} from '../shapes/rect';
import {isPointInConvexShape, toVec4} from '../utils/geom';
import {Timed} from '../utils/timed';
import {ImageTexture} from '../textures/imageTexture';
import {range} from '../utils/lists';
import {Align, FontStyle} from '../fontRenderer';
import {hpbar} from './hpbar';
import {Character} from '../../logic/character';
import {buttonRenderer, coloredShader, fontRenderer, texturedShader} from '../../globals';


export class GameFieldScene implements Scene {

	name: string = 'GameField';
	gameField: GameField;
	nodeToShapeMap: Map<FieldNode, BorderedShape>;
	rect: Rect;
	hoveredNode: FieldNode;
	worldToScreen: Mat4;
	screenToWorld: Mat4;
	pxToScreen: Mat4;
	screenToPx: Mat4;
	animtex: ImageTexture;
	rects: Rect[];
	wx: number;
	wy: number;
	x: number;
	y: number;
	highlight: Map<FieldNode, Vec4>;
	selectedCharacter: Character;
	pathToMove: FieldNode[];

	private selectedNode() {
		return this.selectedCharacter && this.gameField.getCharacterState(this.selectedCharacter).node;
	}

	constructor(
		gameField: GameField
	) {
		this.gameField = gameField;
		this.nodeToShapeMap = new Map<FieldNode, BorderedShape>();
		this.rect = new Rect(
			-16, -26,
			16, 6
			/*, -0.4,
			0.2, 0*/
		);
		this.rects = range(0, 8).map(idx => new Rect(
			1 / 9 * idx,
			0,
			1 / 9 * (idx + 1),
			1
		));
		this.animtex = new ImageTexture('ball-with-ears.png');
		gameField.getNodes().forEach(node => {
			const shape = new BorderedShape(node.points);
			this.nodeToShapeMap.set(node, shape);
		});
		this.highlight = new Map();
		this.pathToMove = [];
	}

	load(): Promise<any> {
		return Promise.all([
			this.animtex.load(),
		]);
	}

	destroy() {
		Array.of(...this.nodeToShapeMap.values()).forEach(v => v.destroy());
		this.animtex.destroy();
		this.rects.forEach(r => r.destroy());
	}

	private drawShape(node: FieldNode, fillColor: Vec4 = [0.8, 0.8, 0.8, 1], borderColor: Vec4 = [1, 1, 1, 1]) {
		const shape = this.nodeToShapeMap.get(node);
		const isSelectedNode = this.selectedNode() === node;
		if (isSelectedNode) {
			coloredShader.setVector4f('borderColor', [0, 0.8, 0, 1]);
			coloredShader.set1f('borderWidth', 3);
		} else {
			coloredShader.setVector4f('borderColor', borderColor);
			coloredShader.set1f('borderWidth', 2);
		}
		coloredShader.setVector4f('fillColor',
			this.highlight.get(node) || fillColor
		);
		coloredShader.setModel('aVertexPosition', shape);
		coloredShader.draw();
	}

	private getCharacterPosition(character): Vec2 {
		const state = this.gameField.getCharacterState(character);
		if (state instanceof CharacterCalmState) {
			return state.node.center;
		}
		if (state instanceof CharacterMovingState) {
			const a = state.from.center;
			const b = state.to.center;
			const p = state.phase;
			return [
				a[0] * (1 - p) + b[0] * p,
				a[1] * (1 - p) + b[1] * p,
			];
		}
	}

	private getCharacterFrame(character): number {
		const state = this.gameField.getCharacterState(character);
		if (state instanceof CharacterCalmState) {
			return 0;
		}
		if (state instanceof CharacterMovingState) {
			const p = state.phase;
			return Math.round((this.rects.length-1) * p);
		}
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

		this.gameField.getCharacters().forEach((character) => {
			texturedShader.useProgram();
			texturedShader.setTexture('texture', this.animtex);
			texturedShader.setMatrix('projectionMatrix', this.pxToScreen);
			texturedShader.setModel('aVertexPosition', this.rect);
			texturedShader.setModel('aTexturePosition', this.rects[this.getCharacterFrame(character)]);
			let c = toVec4(this.getCharacterPosition(character));
			const rot = rotate(identity(), angle, [0, 0, 1]);
			c = multiplyMatToVec(rot, c) as Vec4;
			texturedShader.setMatrix(
				'modelMatrix',
				translate(identity(), [c[0], c[1], 0]),
			);
			texturedShader.draw();
			fontRenderer.drawString(
				character.name + ' ' + hpbar(character.hp, character.maxHp),
				c[0], c[1] - 30,
				FontStyle.BOLD,
				[1, 0, 0, 1],
				this.pxToScreen,
				Align.CENTER,
				1,
				[0, 0, 0, 0.7]
			);
		});

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
		this.highlight.clear();
		if (!this.selectedCharacter || !this.hoveredNode) return;
		this.pathToMove = this.gameField.findPath(this.selectedNode(), this.hoveredNode);
		this.pathToMove.forEach(f => this.highlight.set(f, [0.8, 1.0, 0.8, 1.0]));
	}

	update(dt: number, pressedKeyMap: Map<number, boolean>, cursorX: number, cursorY: number,
		cursorPressed: boolean,
		cursorClicked: boolean
	) {
		buttonRenderer.update(dt, pressedKeyMap, this.screenToPx, cursorX, cursorY, cursorPressed);
		[this.wx, this.wy] = multiplyMatToVec(this.screenToWorld, [cursorX, cursorY, 0, 1]);
		[this.x, this.y] = [cursorX, cursorY];
		const oldHoveredNode = this.hoveredNode;
		const oldSelectedNode = this.selectedNode();
		this.hoveredNode = this.gameField.getNodes().find((node) =>
			isPointInConvexShape([this.wx, this.wy], node.points)
		);
		if (cursorClicked) {
			const newSelectedCharacter = this.gameField.getCharacterAt(this.hoveredNode);
			if (newSelectedCharacter) {
				this.selectedCharacter = newSelectedCharacter;
			} else {
				if (this.selectedCharacter && this.hoveredNode) {
					this.gameField.moveCharacter(this.selectedCharacter, this.hoveredNode);
					this.highlight.clear();
				}
			}
		}
		if (oldHoveredNode !== this.hoveredNode || this.selectedNode() !== oldSelectedNode) {
			this.updatePath();
		}
	}


}
