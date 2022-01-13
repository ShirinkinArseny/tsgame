export function tryDetectError(gl: WebGLRenderingContext) {
	const errorCode = gl.getError();
	if (errorCode !== gl.NO_ERROR) {
		console.error(`GL ERROR OCCURED, CODE=${errorCode}`);
		[
			[gl.INVALID_ENUM, 'Invalid enum'],
			[gl.INVALID_VALUE, 'Invalid value'],
			[gl.INVALID_OPERATION, 'Invalid operation'],
			[gl.INVALID_FRAMEBUFFER_OPERATION, 'Invalid framebuffer operation'],
			[gl.OUT_OF_MEMORY, 'Out of memory'],
			[gl.CONTEXT_LOST_WEBGL, 'Context lost webgl'],
		].filter((item) => item[0] === errorCode)
			.map((item) => item[1])
			.forEach((item) => console.error(`${errorCode} means: ${item}`));
	}
}
