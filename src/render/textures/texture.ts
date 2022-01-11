import {Destroyable} from "../utils/destroyable";

export abstract class Texture implements Destroyable {


    readonly gl: WebGLRenderingContext;
    readonly targetTexture: WebGLTexture;

    constructor(gl: WebGLRenderingContext, targetTexture: WebGLTexture) {
        this.gl = gl;
        this.targetTexture = targetTexture;
    }

    bindTexture() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.targetTexture);
    }

    abstract destroy();

}
