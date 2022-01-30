attribute vec4 vertexPosition;

uniform vec2 screenSize;
uniform vec2 modelTranslate;
uniform vec2 modelScale;

varying float borderness;

void main() {
    gl_Position = vec4(
        (
        vertexPosition.xy *
            modelScale +
            modelTranslate
        ) * 2.0 / screenSize,
        0, 1
    );
    borderness = vertexPosition.z;
}
