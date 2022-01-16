import {playground} from './playground';
import {Scene} from './scene';
import {tryDetectError} from './render/utils/gl';

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

	scene = playground(gl);

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
			scene.update(diff, pressedKeysMap,
				2 * (cursorX / displayWidth - 0.5),
				2 * (cursorY / displayHeight - 0.5),
				(s: Scene) => {
					scene = s;
				});
			scene.render(displayWidth, displayHeight, diff);
			tryDetectError(gl);
			requestAnimationFrame(() => {
				render();
			});
		});
	};

	render();

}

main();
