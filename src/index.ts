import {Scene} from './scene';
import {tryDetectError} from './render/utils/gl';
import {GameFieldScene} from './render/gameFieldScene';
import {GameField} from './gameField';
import {Pixelized} from './render/pixelized';

let prevScene: Scene | undefined = undefined;
let scene: Scene;

function main() {


	const canvas = document.getElementById('canvas') as HTMLCanvasElement;
	const gl = canvas.getContext('webgl2');

	if (!gl) {
		alert('Unable to initialize WebGL. Your browser or machine may not support it.');
		return;
	}

	const pressedKeysMap = new Map<number, boolean>();
	let cursorX = 0;
	let cursorY = 0;
	let cursorPressed = false;
	document.addEventListener('keydown', event => {
		pressedKeysMap[event.keyCode] = true;
	}, false);
	document.addEventListener('keyup', event => {
		pressedKeysMap[event.keyCode] = false;
	}, false);
	document.addEventListener('mousemove', event => {
		cursorX = event.x;
		cursorY = event.y;
	});
	document.addEventListener('mousedown', event => {
		cursorPressed = true;
	});
	document.addEventListener('mouseup', event => {
		cursorPressed = false;
	});

	scene = new Pixelized(gl, new GameFieldScene(gl, new GameField()));

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
			const now = new Date().getTime();
			const diff = (now - prev) / 1000;
			prev = now;

			gl.viewport(0, 0, displayWidth, displayHeight);
			gl.clearColor(1.0, 1.0, 1.0, 1.0);

			gl.enable(gl.BLEND);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

			scene.render(displayWidth, displayHeight, diff);
			tryDetectError(gl);

			scene.update(diff, pressedKeysMap,
				cursorX / displayWidth * 2 - 1,
				cursorY / displayHeight * 2 - 1,
				cursorPressed,
				(s: Scene) => {
					scene = s;
				});

			requestAnimationFrame(() => {
				render();
			});
		});
	};

	render();

}

main();
