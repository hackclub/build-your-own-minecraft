precision highp float;

varying vec2 v_texcoord;
varying vec3 v_color;
varying vec3 v_normal;

uniform sampler2D u_texture;
uniform vec3 u_lightDir;

void main() {
  vec3 normal = normalize(v_normal);
  float light = dot(normal, u_lightDir);
  gl_FragColor = texture2D(u_texture, v_texcoord) * vec4(v_color, 1.0);
  gl_FragColor.rgb *= light;
}
