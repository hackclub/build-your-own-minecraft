#version 300 es

in vec4 a_position;
in vec3 a_color;
in vec3 a_normal;

uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;

out vec3 v_color;
out vec3 v_normal;

void main() {
  gl_Position = u_worldViewProjection * a_position;
  v_color = a_color;
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0.0)).xyz;
}
