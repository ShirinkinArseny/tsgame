attribute vec4 vertexPosition;
attribute vec2 texturePosition;

uniform vec2 screenSize;
uniform vec2 modelTranslate;
uniform vec2 modelScale;

varying vec2 v_texcoord;

void main() {
    gl_Position = vec4(
        (
            vertexPosition.xy *
            modelScale +
            modelTranslate
        ) * 2.0 / screenSize,
        0, 1
    );
    v_texcoord = texturePosition;
}
