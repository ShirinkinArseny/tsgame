precision mediump float;

uniform sampler2D texture;
uniform vec4 texturePositionFrame;
uniform vec2 textureScale;
varying vec2 _texturePosition01;

void main() {

    vec2 from = texturePositionFrame.xy;
    vec2 to = texturePositionFrame.zw;

    float w = texturePositionFrame.z - texturePositionFrame.x;
    float h = texturePositionFrame.w - texturePositionFrame.y;

    vec2 to_from = to - from;

    vec2 _textureCoord = mod(to_from * textureScale * _texturePosition01, to_from) + from;

    gl_FragColor = texture2D(texture, _textureCoord);
}
