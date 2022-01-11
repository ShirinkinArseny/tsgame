import {Texture} from "./texture";
import {tryDetectError} from "../webgl-demo";

export class ImageTexture extends Texture {

    private readonly url: string
    public width: number
    public height: number

    constructor(gl: WebGLRenderingContext, url: string) {
        super(gl, gl.createTexture());
        this.url = url;
    }

    load(gl: WebGLRenderingContext) {
        tryDetectError(gl);
        gl.bindTexture(gl.TEXTURE_2D, this.targetTexture);
        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const image = new Image();
        return new Promise((res, rej) => {
            image.onload = () => {
                this.width = image.width;
                this.height = image.height;
                gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    srcFormat, srcType, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                    gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
                    gl.NEAREST);
                gl.generateMipmap(gl.TEXTURE_2D);
                tryDetectError(gl);
                res(undefined);
            };
            image.src = this.url;
        })
    }

    destroy() {
        this.gl.deleteTexture(this.targetTexture);
    }

}
