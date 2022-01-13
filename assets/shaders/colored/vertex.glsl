attribute vec4 aVertexPosition;

uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;

varying float borderness;

void main() {
    gl_Position = (projectionMatrix * modelMatrix) * vec4(aVertexPosition.xy, 0, 1);
    borderness = aVertexPosition.z;
}
