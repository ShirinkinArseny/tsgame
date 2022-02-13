import {Shader} from './Shader';

const load = (url: string) => {
	return fetch(url).then(r => r.text());
};

export class LoadableShader extends Shader {

	constructor(
		url: string
	) {
		super(
			load('/assets/shaders/' + url + '/vertex.glsl'),
			load('/assets/shaders/' + url + '/fragment.glsl')
		);
	}

}
