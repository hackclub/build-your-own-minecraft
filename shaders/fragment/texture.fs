#version 300 es

precision highp float;

in vec2 v_texcoord;
in vec3 v_color;
in vec3 v_normal;
in float v_lighting;

uniform sampler2D u_texture;
uniform vec3 u_lightDir;
uniform int u_lighting;

out vec4 color;

float map(float val, float oldMin, float oldMax, float newMin, float newMax) {
  return ((val - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin;
}

void main() {
  vec4 tex = texture(u_texture, v_texcoord / 256.0);
  if (tex.w == 0.0) {
    discard;
  }

  vec3 normal = normalize(v_normal);
  float light = max(0.0, dot(normal, u_lightDir));
  color = tex * vec4(v_color, 1.0);
  if (u_lighting == 1) {
    // color.rgb *= light;
    color.rgb *= map(v_lighting, 0.0, 16.0, 0.0, 1.0);
  }
}
