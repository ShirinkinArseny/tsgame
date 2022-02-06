attribute vec2 vertexPosition;
attribute vec2 texturePosition;

uniform vec2 screenSize;
uniform vec2 modelTranslate;
uniform vec2 modelScale;

uniform vec4 texturePositionFrame;

varying vec2 _texturePosition01;

void main() {
    gl_Position = vec4(
        (
            vertexPosition.xy *
            modelScale +
            modelTranslate
        ) * 2.0 / screenSize,
        0, 1
    );
    _texturePosition01 = texturePosition;
}
