export let gl: WebGLRenderingContext;

export const initGlobalGlContext =
	(g: WebGLRenderingContext) => {
		gl = g;
	};
