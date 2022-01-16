import {Scene} from '../scene';
import {GameField} from '../gameField';
import {BorderedShape} from './shapes/borderedShape';
import {FieldNode} from './field/fieldNode';
import {identity, Mat4, multiplyMatToVec, ortho, reverse, rotate, scale, translate, Vec2, Vec4} from './utils/matrices';
import {LoadableShader} from './shaders/loadableShader';
import {drawTriangles} from './utils/gl';
import {Rect} from './shapes/rect';
import {isPointInConvexShape} from './utils/geom';
import {Timed} from './utils/timed';
import {ImageTexture} from './textures/imageTexture';
import {range} from './utils/lists';
import {Key} from '../key';


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
	timed: Timed<Rect>;
	animtex: ImageTexture;
	rects: Rect[];

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
	}

	load(): Promise<any> {
		return Promise.all([
			this.colorShader.load(),
			this.texturedShader.load(),
			this.animtex.load(),
		]);
	}

	destroy() {
		this.colorShader.destroy();
		Array.of(...this.nodeToShapeMap.values()).forEach(v => v.destroy());
		this.animtex.destroy();
		this.rects.forEach(r => r.destroy());
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
		this.colorShader.setVector4f('fillColor', fillColor);
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


		if (this.followedNode) {
			let center = this.followedNode.points.reduce((a, b) => [
				a[0] + b[0],
				a[1] + b[1],
				0, 1
			], [0, 0, 0, 1]).map(v => v / this.followedNode.points.length);
			const rot = rotate(identity(), angle, [0, 0, 1]);
			center = multiplyMatToVec(rot, center) as Vec4;
			const wts = ortho(-w / 2, w / 2, -h / 2, h / 2, 0.0, 100.0);
			this.texturedShader.useProgram();
			this.texturedShader.setTexture('texture', this.animtex);
			this.texturedShader.setMatrix('projectionMatrix', wts);
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
		}


	}

	update(dt: number, pressedKeyMap: Map<number, boolean>, cursorX: number, cursorY: number, cursorPressed: boolean, changeScene: (Scene) => void) {
		const [x, y] = multiplyMatToVec(this.screenToWorld, [cursorX, cursorY, 0, 1]);
		this.hoveredNode = this.gameField.graph.find((node) =>
			isPointInConvexShape([x, y], node.points)
		);
		if (cursorPressed) {
			this.followedNode = this.hoveredNode;
		}
	}


}
