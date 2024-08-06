#version 300 es

precision highp float;

in vec3 v_color;
in vec3 v_normal;

uniform vec3 u_lightDir;

out vec4 color;

void main() {
  vec3 normal = normalize(v_normal);
  float light = dot(normal, u_lightDir);
  color = vec4(v_color, 1.0);
  color *= light;
}
