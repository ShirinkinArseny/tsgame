attribute vec4 aVertexPosition;
attribute vec2 aTexturePosition;

uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;

varying vec2 v_texcoord;

void main() {
    gl_Position = (projectionMatrix * modelMatrix) * aVertexPosition;
    v_texcoord = aTexturePosition;
}
