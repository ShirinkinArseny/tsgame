precision mediump float;

varying vec2 v_texcoord;
uniform vec3 color;

uniform sampler2D texture;

void main() {
    vec4 tex = texture2D(texture, v_texcoord);

    gl_FragColor = vec4(
    color,
    tex.a
    );
}
