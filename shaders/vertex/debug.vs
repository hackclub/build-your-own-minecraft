attribute vec4 a_position;
attribute vec3 a_color;
attribute vec3 a_normal;

uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;

varying vec3 v_color;
varying vec3 v_normal;

void main() {
  gl_Position = u_worldViewProjection * a_position;
  v_color = a_color;
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0.0)).xyz;
}
