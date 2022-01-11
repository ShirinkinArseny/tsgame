precision mediump float;

// Passed in from the vertex shader.
varying vec2 v_texcoord;

// The texture.
uniform sampler2D texture;

void main() {
    gl_FragColor = texture2D(texture, v_texcoord);
}
