import {Rect} from './render/shapes/rect';
import {FontRenderer} from './render/fontRenderer';
import {ButtonRenderer} from './render/buttonRenderer';
import {LoadableShader} from './render/shaders/loadableShader';

export const defaultRect = new Rect();

export const texturedShader = new LoadableShader('textured');
export const coloredShader = new LoadableShader('colored');

export const fontRenderer = new FontRenderer();
export const buttonRenderer = new ButtonRenderer();

export const loadSharedResources = () => {
	return Promise.all([
		texturedShader.load(),
		coloredShader.load(),
		fontRenderer.load(),
		buttonRenderer.load()
	]);
};
