precision mediump float;

varying vec2 v_texcoord;
uniform vec4 color;

uniform sampler2D texture;

void main() {
    vec4 tex = texture2D(texture, v_texcoord);

    gl_FragColor = vec4(
    color.rgb,
    tex.a * color.a
    );
}
