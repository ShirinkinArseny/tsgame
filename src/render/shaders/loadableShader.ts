import {Shader} from './shader';

const load = (url: string) => {
    return fetch(url).then(r => r.text())
}

export class LoadableShader extends Shader {

    constructor(
        gl: WebGLRenderingContext,
        url: string
    ) {
        super(
            gl,
            load("/assets/shaders/"+url+"/vertex.glsl"),
            load("/assets/shaders/"+url+"/fragment.glsl")
        );
    }

}
