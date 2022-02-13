import {fh, fw, gl, initGlobalGlContext} from './GlobalContext';
import {defaultRect, loadSharedResources, postFxShader} from './SharedResources';

import {Scene} from './Scene';
import {GameFieldScene} from './render/gameFieldScene/GameFieldScene';
import {error} from './render/utils/Errors';
import {PointerButton, PointerEvent} from './Events';
import {vec2, vec4} from './render/utils/Vector';
import {Rect} from './render/shapes/Rect';
import {WorldServer} from './logic/world/WorldServer';
import {LocalServerSocket} from './logic/world/Socket';
import {WorldClient} from './logic/world/WorldClient';
import {FBO} from './render/textures/FBO';
import {tryDetectError} from './render/utils/GL';
import {teams} from './constants';
import {initAI} from './logic/AI/AI';

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
let cursorButton: PointerButton = PointerButton.LEFT;
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
document.addEventListener('mousedown', (e) => {
	cursorPressed = CursorPressedState.JustPressed;
	cursorButton =
		e.button === 0 ? PointerButton.LEFT : PointerButton.RIGHT;
});
document.addEventListener('mouseup', () => {
	if (cursorPressed === CursorPressedState.PressedAndHandled) {
		cursorPressed = CursorPressedState.Nothing;
	} else {
		cursorPressed = CursorPressedState.ReleasedBeforeHandle;
	}
});

const fbo = new FBO(fw, fh);

const render = () => {

	const rawWidth = window.innerWidth;
	const rawHeight = window.innerHeight;
	pxPerPx = Math.min(rawWidth / fw, rawHeight / fh);
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

		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


		fbo.bind();
		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.BLEND);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		gl.blendEquation(gl.FUNC_ADD);
		scene.render();
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


		if (Math.random() > 0.999) {
			tryDetectError();
		}

		const pointerEvent = new PointerEvent(
			cursorButton,
			vec2(
				(cursorX + (-rawWidth + canvasWidth) / 2) / canvasWidth * 2 - 1,
				(cursorY + (-rawHeight + canvasHeight) / 2) / canvasHeight * 2 - 1,
			),
			isCursorPressed,
			isCursorClicked,
		);

		scene.update(pressedKeysMap,
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
	//scene = new FontDemoScene();
	const serverSocket = new LocalServerSocket();
	new WorldServer(serverSocket, '12345');
	const clientSocket = serverSocket.newClient();
	const worldClient = new WorldClient(clientSocket, '12345', teams.ally);
	const aiSocket = serverSocket.newClient();
	const worldAi = new WorldClient(aiSocket, '12345', teams.enemy);
	initAI(worldAi, teams.enemy);
	scene = new GameFieldScene(worldClient);
	render();
});
