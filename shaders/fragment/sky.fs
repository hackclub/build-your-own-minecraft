#version 300 es

precision highp float;

in vec4 v_position;

uniform samplerCube u_skybox;
uniform mat4 u_worldViewDirectionProjectionInverse;

out vec4 color;

void main() {
  vec4 t = u_worldViewDirectionProjectionInverse * v_position;
  color = texture(u_skybox, normalize(t.xyz / t.w));
}
