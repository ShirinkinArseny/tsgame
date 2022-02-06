precision mediump float;

uniform sampler2D texture;
uniform vec4 texturePositionFrame;
uniform vec2 textureScale;
uniform float seed;
varying vec2 _texturePosition01;

float gold_noise(in vec2 xy, in float seed){
    return fract(tan(length(xy)*seed)*xy.x);
}

void main() {

    vec2 from = texturePositionFrame.xy;
    vec2 to = texturePositionFrame.zw;

    float w = texturePositionFrame.z - texturePositionFrame.x;
    float h = texturePositionFrame.w - texturePositionFrame.y;

    vec2 to_from = to - from;

    float rr = length(_texturePosition01 - vec2(0.5, 0.5));

    rr *= 1.2;

    float r = pow(
    rr,
    2.0
    )
    ;

    vec2 _textureCoord = mod(to_from * textureScale * _texturePosition01, to_from) + from;

    _textureCoord.x += r * r * gold_noise(_texturePosition01 * 19.0, seed) * 0.01;
    _textureCoord.y += r * r * gold_noise(_texturePosition01 * 31.0, seed + 0.1) * 0.01;

    vec2 _textureCoordR = _textureCoord;
    _textureCoordR.x += 0.005 * r;

    vec2 _textureCoordB = _textureCoord;
    _textureCoordB.x -= 0.005 * r;

    vec4 pureColor = texture2D(texture, _textureCoord);
    vec4 pureColorR = texture2D(texture, _textureCoordR);
    vec4 pureColorB = texture2D(texture, _textureCoordB);

    vec4 res = vec4(
    (1.0 - r) * pureColorR.r,
    (1.0 - r) * pureColor.g,
    (1.0 - r) * pureColorB.b,
    1.0
    );

    float noize = gold_noise(_texturePosition01 * 37.0, seed + 13.0) - 0.5;
    float noizeFactor = 0.06;
    float noizeValue = noize * noizeFactor;

    res.r += noizeValue;
    res.g += noizeValue;
    res.b += noizeValue;

    gl_FragColor = res;
}
