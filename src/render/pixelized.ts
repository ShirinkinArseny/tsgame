import {Scene} from '../scene';
import {LoadableShader} from './shaders/loadableShader';
import {FBO} from './textures/fbo';
import {Rect} from './shapes/rect';
import {identity, ortho, translate} from './utils/matrices';
import {drawTriangles} from './utils/gl';


export class Pixelized implements Scene {

	name: string = 'Pixelized';
	gl: WebGLRenderingContext;
	scene: Scene;
	texturedShader: LoadableShader;
	fbo: FBO;
	rect: Rect;

	constructor(gl: WebGLRenderingContext, scene: Scene) {
		this.gl = gl;
		this.scene = scene;
		this.texturedShader = new LoadableShader(gl, 'textured');
		this.fbo = new FBO(gl, 256, 256);
		this.rect = new Rect(gl);
	}

	destroy() {
		this.scene.destroy();
		this.texturedShader.destroy();
		this.fbo.destroy();
		this.rect.destroy();
	}

	load(): Promise<any> {
		return Promise.all([
			this.scene.load(),
			this.texturedShader.load()
		]);
	}

	render(w: number, h: number, dt: number) {

		const fw = 256;
		const fh = Math.floor(256 * h / w);

		if (fw !== this.fbo.width || fh !== this.fbo.height) {
			this.fbo.destroy();
			this.fbo = new FBO(this.gl, fw, fh);
		}

		this.fbo.bind();
		this.scene.render(fw, fh, dt);
		this.fbo.unbind();


		this.gl.viewport(0, 0, w, h);
		this.texturedShader.useProgram();
		this.texturedShader.setTexture('texture', this.fbo);
		this.texturedShader.setMatrix(
			'projectionMatrix',
			ortho(0, 1, 1, 0, 0.0, 100.0)
		);
		this.texturedShader.setMatrix('modelMatrix', identity());
		this.texturedShader.setModel('aTexturePosition', this.rect);
		this.texturedShader.setModel('aVertexPosition', this.rect);
		drawTriangles(this.gl, this.rect.indicesCount);


	}

	update(dt: number, pressedKeyMap: Map<number, boolean>, cursorX: number, cursorY: number, cursorPressed: boolean,
		cursorClicked: boolean,
		changeScene: (Scene) => void) {
		this.scene.update(dt, pressedKeyMap, cursorX, cursorY, cursorPressed, cursorClicked, changeScene);
	}


}
