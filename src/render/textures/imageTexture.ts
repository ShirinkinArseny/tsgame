import {Texture} from "./texture";
import {tryDetectError} from "../webgl-demo";

export class ImageTexture extends Texture {

    private readonly url: string
    public width: number
    public height: number

    constructor(gl: WebGLRenderingContext, url: string) {
        super(gl, gl.createTexture());
        this.url = "/assets/images/"+url;
    }

    load(): Promise<HTMLImageElement> {
        tryDetectError(this.gl);
        const level = 0;
        const internalFormat = this.gl.RGBA;
        const srcFormat = this.gl.RGBA;
        const srcType = this.gl.UNSIGNED_BYTE;
        const image = new Image();
        return new Promise((res, rej) => {
            image.onload = () => {
                this.width = image.width;
                this.height = image.height;
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.targetTexture);
                this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat,
                    srcFormat, srcType, image);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER,
                    this.gl.NEAREST);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER,
                    this.gl.NEAREST);
                this.gl.generateMipmap(this.gl.TEXTURE_2D);
                tryDetectError(this.gl);
                res(image);
            };
            image.src = this.url;
        })
    }

    destroy() {
        this.gl.deleteTexture(this.targetTexture);
    }

}
