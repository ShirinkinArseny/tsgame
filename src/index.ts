import {fh, fw, gl, initGlobalGlContext} from './globalContext';
import {defaultRect, loadSharedResources, postFxShader, texturedShader,} from './sharedResources';

import {Scene} from './scene';
import {tryDetectError} from './render/utils/gl';
import {GameFieldScene} from './render/gameFieldScene/gameFieldScene';
import {GameField} from './logic/gameField';
import {error} from './render/utils/errors';
import {FBO} from './render/textures/fbo';
import {PointerEvent} from './events';
import {vec2, vec4} from './render/utils/vector';
import {Rect} from './render/shapes/rect';

let prevScene: Scene | undefined = undefined;
let scene: Scene;

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

		const identityRect = new Rect(
			-0.5, 0.5,
			0.5, -0.5
		);

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


		fbo.bind();
		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.BLEND);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		gl.blendEquation(gl.FUNC_ADD);
		scene.render(fw, fh, diff);
		fbo.unbind();

		pxPerPx = Math.min(Math.floor(canvasWidth / fw), Math.floor(canvasHeight / fh));

		gl.viewport(0, 0, canvasWidth, canvasHeight);
		postFxShader.useProgram(false);
		postFxShader.setNumber('seed', new Date().getTime() % 1000);
		postFxShader.setVec4('texturePositionFrame', vec4(0, 0, 1, 1));
		postFxShader.setTexture('texture', fbo);
		postFxShader.setVec2('screenSize', vec2(1, 1));
		postFxShader.setModel('texturePosition', defaultRect);
		postFxShader.setModel('vertexPosition', identityRect);
		postFxShader.draw(vec2(0, 0), vec2(1, 1));


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


loadSharedResources().then(() => {
	scene = new GameFieldScene(new GameField());
	render();
});
