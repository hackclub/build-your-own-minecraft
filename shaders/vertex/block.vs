#version 300 es

in vec4 a_position;
in vec2 a_texcoord;
in vec3 a_color;
in float a_lighting;

uniform mat4 u_worldViewProjection;

out vec2 v_texcoord;
out vec3 v_color;
out float v_lighting;

void main() {
  gl_Position = u_worldViewProjection * a_position;
  v_texcoord = a_texcoord;
  v_color = a_color;
  v_lighting = a_lighting;
}
