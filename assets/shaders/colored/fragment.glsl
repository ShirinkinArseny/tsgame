precision mediump float;

varying float borderness;

uniform vec3 fillColor;
uniform vec3 borderColor;
uniform float borderWidth;

void main() {
    float s = sign(borderness-borderWidth);
    gl_FragColor = vec4(
    fillColor * s + borderColor * (1.0-s),
    1.0
    );
}
