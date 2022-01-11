import {playground} from "./playground";
import {Scene} from "./scene";

let prevScene: Scene | undefined = undefined
let scene: Scene = playground()

function main() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    const pressedKeysMap = new Map<number, boolean>();
    document.addEventListener('keydown', event => {
        pressedKeysMap[event.keyCode] = true;
    }, false);
    document.addEventListener('keyup', event => {
        pressedKeysMap[event.keyCode] = false;
    }, false);


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
            console.log("Swapping scenes: " + prevScene?.name + " -> " + scene.name)
            if (prevScene) {
                prevScene.destroy();
                console.log("Previous scene destroyed: " + prevScene.name)
            }
            init = scene.load(gl).then(() => {
                console.log("New scene loaded: " + scene.name)
            });
            prevScene = scene;
        }
        init.then(() => {
            const now = new Date().getTime();
            const diff = (now - prev) / 1000;
            prev = now;
            scene.update(diff, pressedKeysMap, (s: Scene) => {
                scene = s;
            })
            scene.render(gl, diff);
            requestAnimationFrame(() => {
                render();
            })
        })
    }

    render();

}

main();
