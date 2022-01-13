precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D texture;
uniform sampler2D mask;

void main() {
    vec4 c = texture2D(texture, v_texcoord);
    c.a *= texture2D(mask, v_texcoord).r;
    gl_FragColor = c;
}
