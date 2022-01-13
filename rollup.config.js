import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
	input: 'build/ts/index.js',
	plugins: [sourcemaps()],
	output: {
		sourcemap: true,
		file: 'build/bundle.js',
		format: 'iife',
	}
};
