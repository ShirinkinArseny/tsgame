import {Scene} from '../scene';
import {GameField} from '../gameField';
import {BorderedShape} from './shapes/borderedShape';
import {FieldNode} from './field/fieldNode';
import {identity, Mat4, multiplyMatToVec, ortho, reverse, rotate, translate, Vec4} from './utils/matrices';
import {LoadableShader} from './shaders/loadableShader';
import {drawTriangles} from './utils/gl';
import {Rect} from './shapes/rect';
import {isPointInConvexShape} from './utils/geom';
import {Timed} from './utils/timed';
import {ImageTexture} from './textures/imageTexture';
import {range} from './utils/lists';
import {Align, Font, FontStyle} from './font';
import {Button} from './button';


export class GameFieldScene implements Scene {

	name: string = 'GameField';
	gl: WebGLRenderingContext;
	gameField: GameField;
	nodeToShapeMap: Map<FieldNode, BorderedShape>;
	colorShader: LoadableShader;
	texturedShader: LoadableShader;
	rect: Rect;
	hoveredNode: FieldNode;
	followedNode: FieldNode;
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
		gameField.graph.forEach(node => {
			const shape = new BorderedShape(gl, node.points);
			this.nodeToShapeMap.set(node, shape);
		});
		this.highlight = new Map();
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
		if (node === this.hoveredNode) {
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
		this.gameField.graph.forEach((node) => {
			this.drawShape(node);
		});


		this.pxToScreen = ortho(-w / 2, w / 2, -h / 2, h / 2, 0.0, 100.0);
		this.screenToPx = reverse(this.pxToScreen);
		const ptr = multiplyMatToVec(reverse(this.pxToScreen), [this.x, this.y, 0, 1]);

		if (this.followedNode) {
			let center = this.followedNode.points.reduce((a, b) => [
				a[0] + b[0],
				a[1] + b[1],
				0, 1
			], [0, 0, 0, 1]).map(v => v / this.followedNode.points.length);
			const rot = rotate(identity(), angle, [0, 0, 1]);
			center = multiplyMatToVec(rot, center) as Vec4;
			this.texturedShader.useProgram();
			this.texturedShader.setTexture('texture', this.animtex);
			this.texturedShader.setMatrix('projectionMatrix', this.pxToScreen);
			this.texturedShader.setMatrix(
				'modelMatrix',
				translate(identity(), [center[0], center[1], 0]),
			);
			this.texturedShader.setModel(
				'aVertexPosition',
				this.rect
			);
			this.texturedShader.setModel(
				'aTexturePosition',
				this.timed.get()
			);
			drawTriangles(this.gl, this.rect.indicesCount);
			this.font.drawString(
				'Mike ▲▲▲◭△',
				center[0] + 1, center[1] - 29,
				FontStyle.BOLD,
				[0, 0, 0, 0.7],
				this.pxToScreen,
				Align.CENTER
			);
			this.font.drawString(
				'Mike ▲▲▲◭△',
				center[0], center[1] - 30,
				FontStyle.BOLD,
				[1, 0, 0, 1],
				this.pxToScreen,
				Align.CENTER
			);
		}

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
		if (this.followedNode && this.hoveredNode) {
			const path = this.gameField.findPath(this.followedNode, this.hoveredNode);
			path.forEach(n => {
				this.highlight.set(n, [0, 1, 0, 1]);
			});
		}

	}

	update(dt: number, pressedKeyMap: Map<number, boolean>, cursorX: number, cursorY: number, cursorPressed: boolean, changeScene: (Scene) => void) {
		this.button.update(dt, pressedKeyMap, this.screenToPx, cursorX, cursorY, cursorPressed);
		[this.wx, this.wy] = multiplyMatToVec(this.screenToWorld, [cursorX, cursorY, 0, 1]);
		[this.x, this.y] = [cursorX, cursorY];
		let doUpdatePath = false;
		const oldHovered = this.hoveredNode;
		this.hoveredNode = this.gameField.graph.find((node) =>
			isPointInConvexShape([this.wx, this.wy], node.points)
		);
		if (oldHovered !== this.hoveredNode) {
			doUpdatePath = true;
		}
		if (cursorPressed) {
			const oldFollowedNode = this.followedNode;
			this.followedNode = this.hoveredNode;
			if (oldFollowedNode !== this.followedNode) {
				doUpdatePath = true;
			}
		}
		if (doUpdatePath) {
			this.updatePath();
		}
	}


}
