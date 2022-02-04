import {Rect} from './render/shapes/rect';
import {FontRenderer} from './render/fontRenderer';
import {ButtonRenderer} from './render/buttonRenderer';
import {LoadableShader} from './render/shaders/loadableShader';
import {TextboxRenderer} from './render/textboxRenderer';
import {FrameRenderer} from './render/frameRenderer';
import {PanelRenderer} from './render/panelRenderer';
import {TexturedShader} from './render/shaders/texturedShader';

export let defaultRect!: Rect;
export let texturedShader!: TexturedShader;
export let coloredShader!: LoadableShader;
export let fontRenderer!: FontRenderer;
export let buttonRenderer!: ButtonRenderer;
export let textboxRenderer!: TextboxRenderer;
export let frameRenderer!: FrameRenderer;
export let panelRenderer!: PanelRenderer;

export const loadSharedResources = () => {
	defaultRect = new Rect();
	texturedShader = new TexturedShader();
	coloredShader = new LoadableShader('colored');
	fontRenderer = new FontRenderer();
	buttonRenderer = new ButtonRenderer();
	textboxRenderer = new TextboxRenderer();
	frameRenderer = new FrameRenderer('ui/frame/frame');
	panelRenderer = new PanelRenderer();
	return Promise.all([
		texturedShader.load(),
		coloredShader.load(),
		fontRenderer.load(),
		buttonRenderer.load(),
		textboxRenderer.load(),
		frameRenderer.load(),
		panelRenderer.load()
	]);
};
