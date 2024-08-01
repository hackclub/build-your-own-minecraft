precision highp float;

varying vec3 v_color;
varying vec3 v_normal;

uniform vec3 u_lightDir;

void main() {
  vec3 normal = normalize(v_normal);
  float light = dot(normal, u_lightDir);
  gl_FragColor = vec4(v_color, 1.0);
  gl_FragColor.rgb *= light;
}
