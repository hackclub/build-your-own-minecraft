#version 300 es

in vec2 a_position;
in vec2 a_texcoord;

uniform vec2 u_resolution;

out vec2 v_texcoord;

void main() {
  vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
  v_texcoord = a_texcoord;
}
