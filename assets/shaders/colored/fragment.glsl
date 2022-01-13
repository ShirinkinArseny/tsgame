precision mediump float;

varying float borderness;

uniform vec4 fillColor;
uniform vec4 borderColor;
uniform float borderWidth;

void main() {
    float s = sign(borderness-borderWidth);
    gl_FragColor = fillColor * s + borderColor * (1.0-s);
}
