import {identity, ortho, translate, Vec4} from './render/matrices';
import {tryDetectError} from './render/webgl-demo';
import {drawRect, Rect} from './render/shapes/rect';
import {Scene} from './scene';
import {ImageTexture} from './render/textures/imageTexture';
import {Font, FontStyle} from './render/font';
import {LoadableShader} from './render/shaders/loadableShader';

export const playground: () => Scene = () => {

	function handleKeyboard(pressedKeysMap: Map<number, boolean>) {
		const A = 65;
		const D = 68;
		const W = 87;
		const S = 83;

	}

	let texturedShader: LoadableShader;
	let rect1: Rect;
	let rect2: Rect;
	let texture: ImageTexture;
	let font: Font;

	let fps = 0;

	const text = 'Значимость этих проблем настолько очевидна, что рамки и место обучения кадров в значительной степени обуславливает создание существенных финансовых и административных условий. Задача организации, в особенности же сложившаяся структура организации влечет за собой процесс внедрения и модернизации направлений прогрессивного развития. Не следует, однако забывать, что рамки и место обучения кадров требуют от нас анализа существенных финансовых и административных условий.'.split(' ').map((word, idx) => ({
		word: word,
		fontStyle: idx % 2 === 0 ? FontStyle.NORMAL : FontStyle.BOLD
	}));

	return {
		name: 'Playground',
		load(gl: WebGLRenderingContext) {
			texturedShader = new LoadableShader(gl, 'textured');
			tryDetectError(gl);
			rect1 = new Rect(gl);
			rect2 = new Rect(gl, 0, 0, 0.7, 0.7);
			texture = new ImageTexture(gl, 'sample.png');
			font = new Font(gl);
			tryDetectError(gl);
			return Promise.all([
				texture.load(),
				font.load(),
				texturedShader.load()
			]);
		},
		destroy() {
			texturedShader.destroy();
			rect1.destroy();
			rect2.destroy();
			texture.destroy();
		},
		update: (dt: number, pressedKeyMap: Map<number, boolean>) => {
			handleKeyboard(pressedKeyMap);
		},
		render(gl: WebGLRenderingContext, w: number, h: number, dt: number) {


			gl.viewport(
				0, 0,
				gl.drawingBufferWidth, gl.drawingBufferHeight,
			);
			gl.clearColor(1.0, 1.0, 1.0, 1.0);

			gl.enable(gl.BLEND);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

			texturedShader.useProgram();
			texture.bindTexture();

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
			drawRect(gl);


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
			drawRect(gl);

			const now = 1 / dt;
			fps = 0.99 * fps + 0.01 * now;

			const scale = 10;
			const ww = w / h * scale;
			const hh = scale;

			const viewport: Vec4 = [-ww, ww, hh, -hh];

			const r = (new Date().getTime() % 5000) / 5000 * Math.PI * 2;
			const d = 1; //Math.sin(r) * 0.2 + 1.2

			font.drawString('Hello world! fps: ' + fps, -15, -7, FontStyle.BOLD, [1.0, 0.0, 0.0], viewport);
			font.drawText(text, -15, -5, 40, [0.0, 0.0, 0.3], viewport, d, 1 / d);


		}
	};
};
