import {gl, initGlobalGlContext} from './globalContext';
import {loadSharedResources,} from './sharedResources';

import {Scene} from './scene';
import {tryDetectError} from './render/utils/gl';
import {GameFieldScene} from './render/gameFieldScene/gameFieldScene';
import {GameField} from './logic/gameField';
import {Pixelized} from './render/pixelized';
import {error} from './render/utils/errors';

let prevScene: Scene | undefined = undefined;
let scene: Scene;

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

scene = new Pixelized(new GameFieldScene(new GameField()));

let prev = new Date().getTime();

const render = () => {
	const displayWidth = window.innerWidth;
	const displayHeight = window.innerHeight;
	if (canvas.width != displayWidth ||
		canvas.height != displayHeight) {
		canvas.width = displayWidth;
		canvas.height = displayHeight;
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

		gl.viewport(0, 0, displayWidth, displayHeight);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);

		gl.enable(gl.BLEND);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		scene.render(displayWidth, displayHeight, diff);
		tryDetectError();

		scene.update(diff, pressedKeysMap,
			cursorX / displayWidth * 2 - 1,
			cursorY / displayHeight * 2 - 1,
			isCursorPressed,
			isCursorClicked,
			(s: Scene) => {
				scene = s;
			});

		requestAnimationFrame(() => {
			render();
		});
	});
};

loadSharedResources().then(() => {
	render();
});
