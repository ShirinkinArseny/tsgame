import {FontRenderer} from './render/fontRenderer';
import {ButtonRenderer} from './render/buttonRenderer';
import {LoadableShader} from './render/shaders/loadableShader';
import {Rect} from './render/shapes/rect';


export let gl: WebGLRenderingContext;
export let fontRenderer: FontRenderer;
export let buttonRenderer: ButtonRenderer;
export let texturedShader: LoadableShader;
export let coloredShader: LoadableShader;
export let defaultRect: Rect;

export const initGlobals =
	(g: WebGLRenderingContext) => {
		gl = g;
		fontRenderer = new FontRenderer();
		buttonRenderer = new ButtonRenderer();
		texturedShader = new LoadableShader('textured');
		coloredShader = new LoadableShader('colored');
		defaultRect = new Rect();
	};

export const loadGlobals = () => {
	return Promise.all([
		fontRenderer.load(),
		buttonRenderer.load(),
		texturedShader.load(),
		coloredShader.load()
	]);
};
