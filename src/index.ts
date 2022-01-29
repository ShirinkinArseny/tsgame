import {gl, initGlobalGlContext} from './globalContext';
import {defaultRect, loadSharedResources, texturedShader,} from './sharedResources';

import {Scene} from './scene';
import {tryDetectError} from './render/utils/gl';
import {GameFieldScene} from './render/gameFieldScene/gameFieldScene';
import {GameField} from './logic/gameField';
import {error} from './render/utils/errors';
import {runMatrixTests} from './render/test';
import {FBO} from './render/textures/fbo';
import {identity, ortho} from './render/utils/matrices';
import {PointerEvent} from './events';
import {vec2} from './render/utils/vector';

let prevScene: Scene | undefined = undefined;
let scene: Scene;

const fw = 384;
const fh = Math.floor(fw * 9 / 16);
let pxPerPx: number = 1;

enum CursorPressedState {
	Nothing,
	JustPressed,
	PressedAndHandled,
	ReleasedBeforeHandle
}

const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;

const glContext = canvas.getContext('webgl2') || error('Failed to init webgl context');

initGlobalGlContext(glContext);

const pressedKeysMap = new Map<string, boolean>();
let cursorX = 0;
let cursorY = 0;
let cursorPressed = CursorPressedState.Nothing;
document.addEventListener('keydown', event => {
	pressedKeysMap.set(event.code, true);
}, false);
document.addEventListener('keyup', event => {
	pressedKeysMap.set(event.code, false);
}, false);
document.addEventListener('mousemove', event => {
	cursorX = event.x;
	cursorY = event.y;
});
document.addEventListener('mousedown', () => {
	cursorPressed = CursorPressedState.JustPressed;
});
document.addEventListener('mouseup', () => {
	if (cursorPressed === CursorPressedState.PressedAndHandled) {
		cursorPressed = CursorPressedState.Nothing;
	} else {
		cursorPressed = CursorPressedState.ReleasedBeforeHandle;
	}
});

scene = new GameFieldScene(new GameField());

let prev = new Date().getTime();
const fbo = new FBO(fw, fh);

const render = () => {

	const rawWidth = window.innerWidth;
	const rawHeight = window.innerHeight;
	pxPerPx = Math.min(Math.floor(rawWidth / fw), Math.floor(rawHeight / fh));
	const canvasWidth = pxPerPx * fw;
	const canvasHeight = pxPerPx * fh;
	if (canvas.width != canvasWidth ||
		canvas.height != canvasHeight) {
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
	}
	let init = Promise.resolve();
	if (scene !== prevScene) {
		console.log('Swapping scenes: ' + prevScene?.name + ' -> ' + scene.name);
		if (prevScene) {
			prevScene.destroy();
			console.log('Previous scene destroyed: ' + prevScene.name);
		}
		init = scene.load().then(() => {
			console.log('New scene loaded: ' + scene.name);
		});
		prevScene = scene;
	}
	init.then(() => {
		const isCursorPressed = cursorPressed !== CursorPressedState.Nothing;
		let isCursorClicked = false;
		if (cursorPressed === CursorPressedState.JustPressed) {
			cursorPressed = CursorPressedState.PressedAndHandled;
			isCursorClicked = true;
		} else if (cursorPressed === CursorPressedState.ReleasedBeforeHandle) {
			cursorPressed = CursorPressedState.Nothing;
			isCursorClicked = true;
		}
		const now = new Date().getTime();
		const diff = (now - prev) / 1000;
		prev = now;

		gl.clearColor(1.0, 1.0, 1.0, 1.0);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		fbo.bind();
		scene.render(fw, fh, diff);
		fbo.unbind();

		pxPerPx = Math.min(Math.floor(canvasWidth / fw), Math.floor(canvasHeight / fh));

		gl.viewport(0, 0, canvasWidth, canvasHeight);
		texturedShader.useProgram();
		texturedShader.setTexture('texture', fbo);
		texturedShader.setMatrix(
			'projectionMatrix',
			ortho(0, 1, 1, 0)
		);
		texturedShader.setMatrix('modelMatrix', identity());
		texturedShader.setModel('aTexturePosition', defaultRect);
		texturedShader.setModel('aVertexPosition', defaultRect);
		texturedShader.draw();


		tryDetectError();

		const pointerEvent = new PointerEvent(
			vec2(
				(cursorX + (-rawWidth + canvasWidth) / 2) / canvasWidth * 2 - 1,
				(cursorY + (-rawHeight + canvasHeight) / 2) / canvasHeight * 2 - 1,
			),
			isCursorPressed,
			isCursorClicked,
		);

		scene.update(diff, pressedKeysMap,
			pointerEvent,
			(s: Scene) => {
				scene = s;
			});

		requestAnimationFrame(() => {
			render();
		});
	});
};


runMatrixTests();
loadSharedResources().then(() => {
	render();
});
