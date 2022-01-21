import {Rect} from './render/shapes/rect';
import {FontRenderer} from './render/fontRenderer';
import {ButtonRenderer} from './render/buttonRenderer';
import {LoadableShader} from './render/shaders/loadableShader';

export let defaultRect!: Rect;
export let texturedShader!: LoadableShader;
export let coloredShader!: LoadableShader;
export let fontRenderer!: FontRenderer;
export let buttonRenderer!: ButtonRenderer;

export const loadSharedResources = () => {
	defaultRect = new Rect();
	texturedShader = new LoadableShader('textured');
	coloredShader = new LoadableShader('colored');
	fontRenderer = new FontRenderer();
	buttonRenderer = new ButtonRenderer();
	return Promise.all([
		texturedShader.load(),
		coloredShader.load(),
		fontRenderer.load(),
		buttonRenderer.load()
	]);
};
