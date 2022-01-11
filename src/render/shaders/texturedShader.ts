import  { Shader } from './shader';

export class TexturedShader extends Shader {

    constructor(gl: WebGLRenderingContext) {
        super(
            gl,
            `
            attribute vec4 aVertexPosition;
            attribute vec2 aTexturePosition;

            uniform mat4 u_matrix;

            varying vec2 v_texcoord;

            void main() {
              gl_Position = u_matrix * aVertexPosition;
              v_texcoord = aTexturePosition;
            }
          `,
          `
          precision mediump float;

          // Passed in from the vertex shader.
          varying vec2 v_texcoord;

          // The texture.
          uniform sampler2D u_texture;

          void main() {
            gl_FragColor = texture2D(u_texture, v_texcoord);
          }
        `,
        );
    }

}
