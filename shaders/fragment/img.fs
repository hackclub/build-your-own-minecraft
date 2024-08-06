#version 300 es

precision highp float;

in vec2 v_texcoord;

uniform vec4 u_color;
uniform sampler2D u_texture;

out vec4 color;

void main() {
  vec4 tex = texture(u_texture, v_texcoord);
  if (tex.w == 0.0) {
    discard;
  }
  color = tex * u_color;
}
