import {vec2} from './render/utils/vector';

export let gl: WebGLRenderingContext;
export const fw = 384;
export const fh = Math.floor(fw * 9 / 16);
export const screenSize = vec2(fw, fh);

export const initGlobalGlContext = (g: WebGLRenderingContext) => {
	gl = g;
};
