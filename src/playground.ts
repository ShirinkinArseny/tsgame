import {identity, ortho, translate} from "./render/matrices";
import {tryDetectError} from "./render/webgl-demo";
import {TexturedShader} from "./render/shaders/texturedShader";
import {drawRect, Rect} from "./render/shapes/rect";
import {Scene} from "./scene";
import {ImageTexture} from "./render/textures/imageTexture";
import {Font} from "./render/font";

export const playground: () => Scene = () => {

    function handleKeyboard(pressedKeysMap: Map<number, boolean>) {
        const A = 65;
        const D = 68;
        const W = 87;
        const S = 83;

    }

    let texturedShader: TexturedShader
    let rect1: Rect
    let rect2: Rect
    let texture: ImageTexture
    let font: Font

    let fps = 0;

    return {
        name: "Playground",
        load(gl: WebGLRenderingContext) {
            texturedShader = new TexturedShader(gl);
            tryDetectError(gl);
            rect1 = new Rect(gl);
            rect2 = new Rect(gl, 0, 0, 0.7, 0.7)
            texture = new ImageTexture(gl, "/assets/sample.png");
            font = new Font(gl);
            tryDetectError(gl);
            return Promise.all([
                texture.load(),
                font.load()
            ])
        },
        destroy() {
            texturedShader.destroy()
            rect1.destroy();
            rect2.destroy();
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
            gl.clearColor(1.0, 1.0, 1.0, 1.0);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            texturedShader.useProgram();
            texturedShader.set1i('u_texture', 0);
            texture.bindTexture();

            texturedShader.setMatrix(
                'projectionMatrix',
                ortho(-3.0, 3.0, -3.0, 3.0, 0.0, 100.0)
            );
            texturedShader.setMatrix(
                'modelMatrix',
                translate(identity(), [-1.0, -3.0, 0.0])
            );

            rect1.bind(texturedShader.getAttribute('aVertexPosition'));
            rect1.bind(texturedShader.getAttribute('aTexturePosition'));
            drawRect(gl);


            texturedShader.setMatrix(
                'projectionMatrix',
                ortho(-3.0, 3.0, -3.0, 3.0, 0.0, 100.0)
            );
            texturedShader.setMatrix(
                'modelMatrix',
                translate(identity(), [-3.0, -3.0, 0.0])
            );
            rect1.bind(texturedShader.getAttribute('aVertexPosition'));
            rect2.bind(texturedShader.getAttribute('aTexturePosition'));
            drawRect(gl);

            const now  = 1 / dt;
            fps = 0.998 * fps + 0.002 * now;

            font.drawText("Hello world! fps: "+fps, -10, 0)


        }
    }
}
