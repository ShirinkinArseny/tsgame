import {Scene} from '../../scene';
import {GameField} from '../../logic/gameField';
import {BorderedShape} from '../shapes/borderedShape';
import {FieldNode} from '../../logic/field/fieldNode';
import {identity, Mat4, multiplyMatToVec, ortho, reverse, rotate, translate, Vec4} from '../utils/matrices';
import {LoadableShader} from '../shaders/loadableShader';
import {drawTriangles} from '../utils/gl';
import {Rect} from '../shapes/rect';
import {center, isPointInConvexShape, toVec4} from '../utils/geom';
import {Timed} from '../utils/timed';
import {ImageTexture} from '../textures/imageTexture';
import {range} from '../utils/lists';
import {Align, Font, FontStyle} from '../font';
import {Button} from '../button';
import {hpbar} from './hpbar';
import {Character} from '../../logic/character';


export class GameFieldScene implements Scene {

	name: string = 'GameField';
	gl: WebGLRenderingContext;
	gameField: GameField;
	nodeToShapeMap: Map<FieldNode, BorderedShape>;
	colorShader: LoadableShader;
	texturedShader: LoadableShader;
	rect: Rect;
	hoveredNode: FieldNode;
	worldToScreen: Mat4;
	screenToWorld: Mat4;
	pxToScreen: Mat4;
	screenToPx: Mat4;
	timed: Timed<Rect>;
	animtex: ImageTexture;
	rects: Rect[];
	font: Font;
	button: Button;
	wx: number;
	wy: number;
	x: number;
	y: number;
	highlight: Map<FieldNode, Vec4>;
	selectedCharacter: Character;
	pathToMove: FieldNode[];

	private selectedNode() {
		return this.gameField.getCharacterNode(this.selectedCharacter);
	}

	constructor(
		gl: WebGLRenderingContext,
		gameField: GameField
	) {
		this.gl = gl;
		this.gameField = gameField;
		this.nodeToShapeMap = new Map<FieldNode, BorderedShape>();
		this.colorShader = new LoadableShader(gl, 'colored');
		this.texturedShader = new LoadableShader(gl, 'textured');
		this.rect = new Rect(gl,
			-16, -26,
			16, 6
			/*, -0.4,
			0.2, 0*/
		);
		this.button = new Button(gl);
		this.font = new Font(gl);
		this.rects = range(0, 8).map(idx => new Rect(
			gl,
			1 / 9 * idx,
			0,
			1 / 9 * (idx + 1),
			1
		));
		this.timed = new Timed<Rect>([
			...this.rects,
		], 100);
		this.animtex = new ImageTexture(gl, 'ball-with-ears.png');
		gameField.getNodes().forEach(node => {
			const shape = new BorderedShape(gl, node.points);
			this.nodeToShapeMap.set(node, shape);
		});
		this.highlight = new Map();
		this.pathToMove = [];
	}

	load(): Promise<any> {
		return Promise.all([
			this.colorShader.load(),
			this.texturedShader.load(),
			this.animtex.load(),
			this.font.load(),
			this.button.load()
		]);
	}

	destroy() {
		this.colorShader.destroy();
		Array.of(...this.nodeToShapeMap.values()).forEach(v => v.destroy());
		this.animtex.destroy();
		this.rects.forEach(r => r.destroy());
		this.font.destroy();
		this.button.destroy();
	}

	private drawShape(node: FieldNode, fillColor: Vec4 = [0.8, 0.8, 0.8, 1], borderColor: Vec4 = [1, 1, 1, 1]) {
		const shape = this.nodeToShapeMap.get(node);
		const isSelectedNode = this.selectedNode() === node;
		if (isSelectedNode) {
			this.colorShader.setVector4f('borderColor', [0, 0.8, 0, 1]);
			this.colorShader.set1f('borderWidth', 3);
		} else {
			this.colorShader.setVector4f('borderColor', borderColor);
			this.colorShader.set1f('borderWidth', 2);
		}
		this.colorShader.setVector4f('fillColor',
			this.highlight.get(node) || fillColor
		);
		this.colorShader.setModel('aVertexPosition', shape);
		drawTriangles(this.gl, shape.indicesCount);
	}

	render(w: number, h: number, dt: number) {
		const angle = (new Date().getTime() % 60000) / 60000 * Math.PI * 2;
		this.worldToScreen = ortho(-w / 2, w / 2, -h / 2, h / 2, 0.0, 100.0);

		rotate(this.worldToScreen, angle, [0, 0, 1]);
		this.screenToWorld = reverse(this.worldToScreen);
		this.colorShader.useProgram();
		this.colorShader.setMatrix('projectionMatrix', this.worldToScreen);
		this.colorShader.setMatrix('modelMatrix', identity());
		this.gameField.getNodes().forEach((node) => {
			this.drawShape(node);
		});


		this.pxToScreen = ortho(-w / 2, w / 2, -h / 2, h / 2, 0.0, 100.0);
		this.screenToPx = reverse(this.pxToScreen);
		const ptr = multiplyMatToVec(reverse(this.pxToScreen), [this.x, this.y, 0, 1]);

		this.gameField.getCharacters().forEach((character) => {
			this.texturedShader.useProgram();
			this.texturedShader.setTexture('texture', this.animtex);
			this.texturedShader.setMatrix('projectionMatrix', this.pxToScreen);
			this.texturedShader.setModel(
				'aVertexPosition',
				this.rect
			);
			this.texturedShader.setModel(
				'aTexturePosition',
				this.timed.get()
			);
			let c = toVec4(this.gameField.getCharacterPosition(character));
			const rot = rotate(identity(), angle, [0, 0, 1]);
			c = multiplyMatToVec(rot, c) as Vec4;
			this.texturedShader.setMatrix(
				'modelMatrix',
				translate(identity(), [c[0], c[1], 0]),
			);
			drawTriangles(this.gl, this.rect.indicesCount);
			this.font.drawString(
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

		let x = -120;
		const y = h / 2 - 23;

		x += this.button.render(
			x,
			y,
			'Inventory',
			this.pxToScreen,
			() => {
				console.log('AAA');
			}
		) + 2;

		x += this.button.render(
			x,
			y,
			'Stats',
			this.pxToScreen,
			() => {
				console.log('БББ');
			}
		) + 2;

		x += this.button.render(
			x,
			y,
			'Map',
			this.pxToScreen,
			() => {
				console.log('CCC');
			}
		) + 2;


	}

	private updatePath() {
		this.highlight.clear();
		if (!this.selectedCharacter || !this.hoveredNode) return;
		this.pathToMove = this.gameField.findPath(this.selectedNode(), this.hoveredNode);
		this.pathToMove.forEach(f => this.highlight.set(f, [0.8, 1.0, 0.8, 1.0]));
	}

	update(dt: number, pressedKeyMap: Map<number, boolean>, cursorX: number, cursorY: number,
		cursorPressed: boolean,
		cursorClicked: boolean,
		changeScene: (Scene) => void) {
		this.button.update(dt, pressedKeyMap, this.screenToPx, cursorX, cursorY, cursorPressed);
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
