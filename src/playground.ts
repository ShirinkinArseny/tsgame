import {identity, Mat4, ortho, perspective, rotate, scale, translate} from "./render/matrices";
import {texture} from "./index";
import {tryDetectError} from "./render/webgl-demo";
import {Shader} from "./render/shaders/shader";
import {IModel} from "./render/shapes/model";
import {TexturedShader} from "./render/shaders/texturedShader";
import {Rect} from "./render/shapes/rect";
import {Texture} from "./render/textures/texture";
import {DefaultShader} from "./render/shaders/defaultShader";
import {Cube} from "./render/shapes/cube";
import {Sphere} from "./render/shapes/sphere";
import {Octo} from "./render/shapes/octo";
import {Cylinder} from "./render/shapes/cylinder";
import {FBO} from "./render/textures/fbo";
import {Scene} from "./scene";

let cubeRotation = 0.0;
let yAngle = 0.0;
let distance = 6.0;

export const playground: () => Scene = () => {

    function getCubeMatrix() {
        const modelMatrix = identity();
        translate(modelMatrix, [2.0, 0.0, 0.0]);
        rotate(modelMatrix, cubeRotation, [0, 0, 1]);
        rotate(modelMatrix, cubeRotation * 0.2, [0, 1, 0]);
        return modelMatrix;
    }

    function getOctoMatrix() {
        const modelMatrix = identity();
        translate(modelMatrix, [0.0, 1.0, 0.0]);
        rotate(modelMatrix, cubeRotation * 0.2, [1, 0, 0]);
        return modelMatrix;
    }

    function getOctoMatrix2() {
        const modelMatrix = identity();
        scale(modelMatrix, [2.0, 1.0, 1.0]);
        translate(modelMatrix, [-1.0, 1.0, 0.0]);
        rotate(modelMatrix, cubeRotation * 0.2, [1, 0, 0]);

        return modelMatrix;
    }

    function getCylinderMatrix() {
        const modelMatrix = identity();
        translate(modelMatrix, [1.0, -1.0, 0.0]);
        rotate(modelMatrix, cubeRotation * 0.7, [1, 0, 0]);
        return modelMatrix;
    }

    function drawScene(
        gl: WebGLRenderingContext,
        shader: Shader,
        models: IModel[],
        viewMatrix: Mat4,
    ) {

        const time = new Date().getTime();

        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        gl.clearDepth(1.0); // Clear everything
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fieldOfView = 60 * (Math.PI / 180); // in radians
        const canvas = gl.canvas as HTMLCanvasElement;
        const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = perspective(
            fieldOfView,
            aspect,
            zNear,
            zFar,
        );


        shader.useProgram();

        shader.setMatrix('uProjectionMatrix', projectionMatrix);
        shader.setMatrix('uViewMatrix', viewMatrix);

        const circleTime = (time % 8) / 8;
        const piTime = Math.PI * 2 * circleTime;
        const sinTime = Math.sin(piTime);
        const cosTime = Math.cos(piTime);

        shader.setVector4f(
            'lightDirection',
            [sinTime, cosTime, 0.8, 0.0],
        );

        models[0].draw(getCubeMatrix(), shader);
        models[1].draw(getOctoMatrix(), shader);
        models[2].draw(getOctoMatrix2(), shader);
        models[3].draw(getCylinderMatrix(), shader);

        tryDetectError(gl);
    }

    function drawFBO(gl: WebGLRenderingContext, texturedShader: TexturedShader, rect: Rect, fboX: Texture, fboY: Texture, fboZ: Texture) {
        texturedShader.useProgram();
        texturedShader.set1i('u_texture', 0);
        rect.bind(texturedShader.getAttribute('aVertexPosition'));

        function draw(fbo: Texture, x: number) {
            fbo.bindTexture();
            const orto = ortho(-3.0, 3.0, -3.0, 3.0, 0.0, 100.0);
            translate(orto, [x, -3.0, 0.0]);
            texturedShader.setMatrix('u_matrix', orto);
            rect.draw();
        }

        draw(fboX, -3.0);
        draw(fboY, -2.0);
        draw(fboZ, -1.0);
    }

    function handleKeyboard(pressedKeysMap: Map<number, boolean>) {
        const A = 65;
        const D = 68;
        const W = 87;
        const S = 83;
        if (pressedKeysMap[A]) {
            yAngle -= 0.02;
        }
        if (pressedKeysMap[D]) {
            yAngle += 0.02;
        }
        if (pressedKeysMap[W]) {
            distance -= 0.02;
        }
        if (pressedKeysMap[S]) {
            distance += 0.02;
        }
    }

    let fboX: FBO
    let fboY: FBO
    let fboZ: FBO
    let basicShader: DefaultShader
    let texturedShader: TexturedShader
    let models: IModel[]
    let rect: Rect

    return {
        init(gl: WebGLRenderingContext) {
            basicShader = new DefaultShader(gl);
            texturedShader = new TexturedShader(gl);

            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);

            tryDetectError(gl);

            const cubeModel = new Cube(gl);
            const octoModel = new Sphere(gl);
            const octoModel2 = new Octo(gl);
            const cylinderModel = new Cylinder(gl);

            rect = new Rect(gl);

            tryDetectError(gl);

            fboX = new FBO(gl, 512, 512);
            fboY = new FBO(gl, 512, 512);
            fboZ = new FBO(gl, 512, 512);

            models = [cubeModel, octoModel, octoModel2, cylinderModel];

            const canvas = gl.canvas as HTMLCanvasElement;
            return Promise.resolve()
        },
        destroy(gl: WebGLRenderingContext) {
            fboX.destroy(gl)
            fboY.destroy(gl)
            fboZ.destroy(gl)
            basicShader.destroy(gl)
            texturedShader.destroy(gl)
            models.forEach(m => m.destroy(gl))
        },
        update: (dt: Number, pressedKeyMap: Map<number, boolean>) => {
            handleKeyboard(pressedKeyMap);
        },
        render(gl: WebGLRenderingContext, dt: number) {

            cubeRotation += dt;

            {
                fboX.bind();
                const viewMatrix = identity();
                translate(viewMatrix, [0, 0, -distance]);
                tryDetectError(gl);
                drawScene(gl, basicShader, models, viewMatrix);
                fboX.unbind();
            }
            {
                fboY.bind();
                const viewMatrix = identity();
                translate(viewMatrix, [0, 0, -distance]);
                rotate(viewMatrix, Math.PI / 2, [0, 1, 0]);
                tryDetectError(gl);
                drawScene(gl, basicShader, models, viewMatrix);
                fboY.unbind();
            }
            {
                fboZ.bind();
                const viewMatrix = identity();
                translate(viewMatrix, [0, 0, -distance]);
                rotate(viewMatrix, Math.PI / 2, [1, 0, 0]);
                drawScene(gl, basicShader, models, viewMatrix);
                fboZ.unbind();
            }

            gl.viewport(
                0, 0,
                gl.drawingBufferWidth, gl.drawingBufferHeight,
            );
            const viewMatrix = identity();
            translate(viewMatrix, [0, 0, -distance]);
            rotate(viewMatrix, yAngle, [0, 1, 0]);
            drawScene(gl, basicShader, models, viewMatrix);

            drawFBO(gl, texturedShader, rect, fboX, fboY, texture);
        }
    }
}
