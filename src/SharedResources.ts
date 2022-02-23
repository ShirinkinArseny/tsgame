import {Rect} from './render/shapes/Rect';
import {FontRenderer} from './render/FontRenderer';
import {ButtonRenderer} from './render/ButtonRenderer';
import {LoadableShader} from './render/shaders/LoadableShader';
import {TextboxRenderer} from './render/TextboxRenderer';
import {FrameRenderer} from './render/FrameRenderer';
import {PanelRenderer} from './render/PanelRenderer';
import {TexturedShader} from './render/shaders/TexturedShader';
import {TextureMap} from './render/TextureMap';

export let defaultRect!: Rect;
export let texturedShader!: TexturedShader;
export let postFxShader!: TexturedShader;
export let coloredShader!: LoadableShader;
export let fontRenderer!: FontRenderer;
export let buttonRenderer!: ButtonRenderer;
export let textboxRenderer!: TextboxRenderer;
export let frameRenderer!: FrameRenderer;
export let panelRenderer!: PanelRenderer;
export let portraits!: TextureMap;

export const loadSharedResources = () => {
	defaultRect = new Rect();
	texturedShader = new TexturedShader();
	postFxShader = new TexturedShader('postfx');
	coloredShader = new LoadableShader('colored');
	fontRenderer = new FontRenderer();
	buttonRenderer = new ButtonRenderer();
	textboxRenderer = new TextboxRenderer();
	frameRenderer = new FrameRenderer('ui/frame/frame');
	panelRenderer = new PanelRenderer();
	portraits = new TextureMap('characters/portraits/portraits');
	return Promise.all([
		texturedShader.load(),
		postFxShader.load(),
		coloredShader.load(),
		fontRenderer.load(),
		buttonRenderer.load(),
		textboxRenderer.load(),
		frameRenderer.load(),
		panelRenderer.load(),
		portraits.load()
	]);
};
