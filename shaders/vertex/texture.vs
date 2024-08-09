#version 300 es

in vec4 a_position;
in vec2 a_texcoord;
in vec3 a_color;
in vec3 a_normal;
in float a_lighting;

uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;

out vec2 v_texcoord;
out vec3 v_color;
out vec3 v_normal;
out float v_lighting;

void main() {
  gl_Position = u_worldViewProjection * a_position;
  v_texcoord = a_texcoord;
  v_color = a_color;
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0.0)).xyz;
  v_lighting = a_lighting;
}
