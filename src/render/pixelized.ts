import {Scene} from '../scene';
import {FBO} from './textures/fbo';
import {identity, ortho} from './utils/matrices';
import {defaultRect, gl, texturedShader} from '../globals';


export class Pixelized implements Scene {

	name: string = 'Pixelized';
	scene: Scene;
	fbo: FBO;

	constructor(scene: Scene) {
		this.scene = scene;
		this.fbo = new FBO(256, 256);
	}

	destroy() {
		this.scene.destroy();
		this.fbo.destroy();
	}

	load(): Promise<any> {
		return Promise.all([
			this.scene.load(),
		]);
	}

	render(w: number, h: number, dt: number) {

		const fw = 256;
		const fh = Math.floor(256 * h / w);

		if (fw !== this.fbo.width || fh !== this.fbo.height) {
			this.fbo.destroy();
			this.fbo = new FBO(fw, fh);
		}

		this.fbo.bind();
		this.scene.render(fw, fh, dt);
		this.fbo.unbind();


		gl.viewport(0, 0, w, h);
		texturedShader.useProgram();
		texturedShader.setTexture('texture', this.fbo);
		texturedShader.setMatrix(
			'projectionMatrix',
			ortho(0, 1, 1, 0, 0.0, 100.0)
		);
		texturedShader.setMatrix('modelMatrix', identity());
		texturedShader.setModel('aTexturePosition', defaultRect);
		texturedShader.setModel('aVertexPosition', defaultRect);
		texturedShader.draw();


	}

	update(dt: number, pressedKeyMap: Map<number, boolean>, cursorX: number, cursorY: number, cursorPressed: boolean,
		cursorClicked: boolean,
		changeScene: (Scene) => void) {
		this.scene.update(dt, pressedKeyMap, cursorX, cursorY, cursorPressed, cursorClicked, changeScene);
	}


}
