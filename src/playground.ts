import {ortho, translate} from "./render/matrices";
import {tryDetectError} from "./render/webgl-demo";
import {TexturedShader} from "./render/shaders/texturedShader";
import {Rect} from "./render/shapes/rect";
import {Scene} from "./scene";
import {ImageTexture} from "./render/textures/imageTexture";

export const playground: () => Scene = () => {

    function handleKeyboard(pressedKeysMap: Map<number, boolean>) {
        const A = 65;
        const D = 68;
        const W = 87;
        const S = 83;

    }

    let texturedShader: TexturedShader
    let rect: Rect
    let texture: ImageTexture

    return {
        init(gl: WebGLRenderingContext) {
            texturedShader = new TexturedShader(gl);
            tryDetectError(gl);
            rect = new Rect(gl);
            texture = new ImageTexture(gl, "/assets/sample.png");
            tryDetectError(gl);
            return Promise.all([
                texture.load(gl)
            ])
        },
        destroy() {
            texturedShader.destroy()
            rect.destroy();
            texture.destroy();
        },
        update: (dt: Number, pressedKeyMap: Map<number, boolean>) => {
            handleKeyboard(pressedKeyMap);
        },
        render(gl: WebGLRenderingContext, dt: number) {


            gl.viewport(
                0, 0,
                gl.drawingBufferWidth, gl.drawingBufferHeight,
            );
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clearDepth(1.0);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            texturedShader.useProgram();
            texturedShader.set1i('u_texture', 0);
            rect.bind(texturedShader.getAttribute('aVertexPosition'));
            rect.bind(texturedShader.getAttribute('aTexturePosition'));


            texture.bindTexture();
            const orto = ortho(-3.0, 3.0, -3.0, 3.0, 0.0, 100.0);
            translate(orto, [-1.0, -3.0, 0.0]);
            texturedShader.setMatrix('u_matrix', orto);
            rect.draw();
        }
    }
}
