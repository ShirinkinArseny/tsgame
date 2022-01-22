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
	animtex: ImageTexture = new ImageTexture('spacedude.png');
	icons: ImageTexture = new ImageTexture('icons.png');
	animRects: Rect[] = range(0, 11).map(idx => new Rect(
		1 / 12 * idx,
		0,
		1 / 12 * (idx + 1),
		1
	));
	iconRects: Rect[] = range(0, 3).map(idx => new Rect(idx / 4, 0, (idx + 1) / 4, 1 / 4));
	wx: number = 0;
	wy: number = 0;
	x: number = 0;
	y: number = 0;
	px: number = 0;
	py: number = 0;
	highlight: Map<FieldNode, Vec4> = new Map();
	selectedCharacter: Character | undefined;
	pathToMove: FieldNode[] = [];

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
			this.animtex.load(),
			this.icons.load()
		]);
	}

	destroy() {
		Array.of(...this.nodeToShapeMap.values()).forEach(v => v.destroy());
		this.animtex.destroy();
		this.icons.destroy();
		this.animRects.forEach(r => r.destroy());
		this.iconRects.forEach(r => r.destroy());
	}

	private drawShape(node: FieldNode, fillColor: Vec4 = [0.8, 0.8, 0.8, 1], borderColor: Vec4 = [1, 1, 1, 1]) {
		const shape = this.nodeToShapeMap.get(node) || error('No shape for this node found');
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

	private getCharacterFrame(character: Character): number {
		const state = this.gameField.getCharacterState(character);
		switch (state.kind) {
		case 'CharacterCalmState': {
			const _01 = (new Date().getTime() % 1000) / 500 > 1 ? 0 : 1;
			return this.animRects.length - 2 + _01;
		}
		case 'CharacterMovingState': {
			const frames = 5;
			const p = Math.round((frames - 1) * state.phase);
			const a = multiplyMatToVec(this.worldToScreen, toVec4(state.from.center));
			const b = multiplyMatToVec(this.worldToScreen, toVec4(state.to.center));
			const f = p + (a[0] > b[0] ? 1 : 0) * frames;
			return f;
		}
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
			texturedShader.setModel('aTexturePosition', this.animRects[this.getCharacterFrame(character)]);
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
				c[0] + 16, c[1] - 40,
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
		this.highlight.clear();
		const selectedNode = this.selectedNode();
		if (!selectedNode || !this.hoveredNode) return;
		this.pathToMove = this.gameField.findPath(selectedNode, this.hoveredNode);
		this.pathToMove.forEach(f => this.highlight.set(f, [0.8, 1.0, 0.8, 1.0]));
	}

	update(dt: number, pressedKeyMap: Map<string, boolean>, cursorX: number, cursorY: number,
		cursorPressed: boolean,
		cursorClicked: boolean
	) {
		buttonRenderer.update(dt, pressedKeyMap, this.screenToPx, cursorX, cursorY, cursorPressed);
		[this.wx, this.wy] = multiplyMatToVec(this.screenToWorld, [cursorX, cursorY, 0, 1]);
		[this.px, this.py] = multiplyMatToVec(this.screenToPx, [cursorX, cursorY, 0, 1]);
		[this.x, this.y] = [cursorX, cursorY];
		const oldHoveredNode = this.hoveredNode;
		const oldSelectedNode = this.selectedNode();
		this.hoveredNode = this.gameField.getNodes().find((node) =>
			isPointInConvexShape([this.wx, this.wy], node.points)
		);
		if (cursorClicked) {
			const newSelectedCharacter = this.gameField.getCharacterAt(this.hoveredNode);
			if (!newSelectedCharacter && this.selectedCharacter && this.hoveredNode) {
				this.gameField.moveCharacter(this.selectedCharacter, this.hoveredNode);
				this.highlight.clear();
			} else {
				this.selectedCharacter = newSelectedCharacter;
			}
		}
		if (oldHoveredNode !== this.hoveredNode || this.selectedNode() !== oldSelectedNode) {
			this.updatePath();
		}
	}


}
