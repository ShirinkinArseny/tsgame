import {identity, ortho, rotate, translate, Vec4} from './render/matrices';
import {Scene} from './scene';
import {ImageTexture} from './render/textures/imageTexture';
import {Font, FontStyle} from './render/font';
import {LoadableShader} from './render/shaders/loadableShader';
import {drawTriangles, tryDetectError} from './render/utils/gl';
import {Rect} from './render/shapes/rect';
import {ConvexShape} from './render/shapes/convexShape';
import {BorderedShape} from './render/shapes/borderedShape';
import {Timed} from './render/utils/timed';
import {range} from './render/utils/lists';

export const playground: (gl: WebGLRenderingContext) => Scene = (gl) => {

	let texturedShader: LoadableShader;
	let colorShader: LoadableShader;
	let rect1: Rect;
	let rect2: Rect;
	let rects: Rect[];
	let timed: Timed<Rect>;
	let shape: ConvexShape;
	let animtex: ImageTexture;
	let masktex: ImageTexture;
	let texture: ImageTexture;
	let font: Font;

	let fps = 0;

	const text = 'Значимость этих проблем настолько очевидна, что рамки и место обучения кадров в значительной степени обуславливает создание существенных финансовых и административных условий. Задача организации, в особенности же сложившаяся структура организации влечет за собой процесс внедрения и модернизации направлений прогрессивного развития. Не следует, однако забывать, что рамки и место обучения кадров требуют от нас анализа существенных финансовых и административных условий.'.split(' ').map((word, idx) => ({
		word: word,
		fontStyle: idx % 2 === 0 ? FontStyle.NORMAL : FontStyle.BOLD
	}));

	let cx = 0;

	return {
		name: 'Playground',
		load() {
			texturedShader = new LoadableShader(gl, 'textured');
			colorShader = new LoadableShader(gl, 'colored');
			shape = new BorderedShape(
				gl,
				[
					[0, 0],
					[1, 0],
					[1.5, 0.5],
					[1, 1],
					[0, 1]
				],
			);
			rect1 = new Rect(gl);
			rect2 = new Rect(gl, 0, 0, 0.7, 0.7);
			rects = range(0, 6).map(idx => new Rect(
				gl,
				0.125 * idx,
				0,
				0.125 * (idx + 1),
				0.125
			));
			timed = new Timed<Rect>([
				...rects,
				rects[5],
				rects[4],
				rects[3],
				rects[2],
				rects[1],
			], 100);
			texture = new ImageTexture(gl, 'sample.png');
			animtex = new ImageTexture(gl, 'anim.png');
			masktex = new ImageTexture(gl, 'mask.png');
			font = new Font(gl);
			return Promise.all([
				texture.load(),
				font.load(),
				texturedShader.load(),
				colorShader.load(),
				animtex.load(),
				masktex.load()
			]);
		},
		destroy() {
			texturedShader.destroy();
			rect1.destroy();
			rect2.destroy();
			texture.destroy();
			animtex.destroy();
			masktex.destroy();
			rects.forEach(r => r.destroy());
		},
		update: (dt: number, pressedKeyMap: Map<number, boolean>, cursorX: number, cursorY: number) => {
			const p = 1 - cursorY * cursorY;
			cx = p * cx + (1 - p) * (cursorX - 0.5) * 2;
		},
		render(w: number, h: number, dt: number) {


			gl.viewport(
				0, 0,
				gl.drawingBufferWidth, gl.drawingBufferHeight,
			);
			gl.clearColor(1.0, 1.0, 1.0, 1.0);

			gl.enable(gl.BLEND);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

			texturedShader.useProgram();
			texturedShader.setTexture('texture', texture);

			texturedShader.setMatrix(
				'projectionMatrix',
				ortho(-3.0, 3.0, -3.0, 3.0, 0.0, 100.0)
			);
			texturedShader.setMatrix(
				'modelMatrix',
				translate(identity(), [-1.0, -3.0, 0.0])
			);

			rect1.bind(texturedShader.getAttribute('aVertexPosition'));
			rect1.bind(texturedShader.getAttribute('aTexturePosition'));
			drawTriangles(gl, rect1.indicesCount);


			texturedShader.setMatrix(
				'projectionMatrix',
				ortho(-3.0, 3.0, -3.0, 3.0, 0.0, 100.0)
			);
			texturedShader.setMatrix(
				'modelMatrix',
				translate(identity(), [-3.0, -3.0, 0.0])
			);
			rect1.bind(texturedShader.getAttribute('aVertexPosition'));
			rect2.bind(texturedShader.getAttribute('aTexturePosition'));
			drawTriangles(gl, rect1.indicesCount);

			texturedShader.setTexture('texture', animtex);
			texturedShader.setTexture('mask', masktex);
			texturedShader.setMatrix(
				'projectionMatrix',
				ortho(-3.0, 3.0, 3.0 * h / w, -3.0 * h / w, 0.0, 100.0)
			);
			texturedShader.setMatrix(
				'modelMatrix',
				translate(identity(), [2.0, 0.5, 0.0])
			);
			rect1.bind(texturedShader.getAttribute('aVertexPosition'));
			timed.get().bind(texturedShader.getAttribute('aTexturePosition'));
			drawTriangles(gl, rect1.indicesCount);


			const now = 1 / dt;
			fps = 0.99 * fps + 0.01 * now;

			const scale = 10;
			const ww = w / h * scale;
			const hh = scale;

			const viewport = ortho(-ww, ww, hh, -hh, 0.0, 100.0);
			rotate(viewport, cx * Math.PI, [0, 0, 1]);

			const r = (new Date().getTime() % 5000) / 5000 * Math.PI * 2;
			const d = Math.sin(r) * 0.2 + 1.2;

			font.drawString('Hello world! fps: ' + fps, -15, -7, FontStyle.BOLD, [1.0, 0.0, 0.0], viewport);
			font.drawText(text, -15, -5, 40, [0.0, 0.0, 0.3], viewport, d, 1 / d);


			colorShader.useProgram();
			colorShader.setVector4f('fillColor', [0.0, 1.0, 0.0, 0.5]);
			colorShader.setVector4f('borderColor', [1.0, 0.0, 0.0, 1.0]);
			colorShader.set1f('borderWidth', 0.05);
			colorShader.setMatrix(
				'projectionMatrix',
				ortho(-3.0, 3.0, -3.0 * h / w, 3.0 * h / w, 0.0, 100.0)
			);
			colorShader.setMatrix(
				'modelMatrix',
				identity()
			);
			shape.bind(texturedShader.getAttribute('aVertexPosition'));
			drawTriangles(gl, shape.indicesCount);


		}
	};
};
