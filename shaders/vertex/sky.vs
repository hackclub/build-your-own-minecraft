#version 300 es

in vec4 a_position;

out vec4 v_position;

void main() {
  gl_Position = a_position;
  gl_Position.z = 1.0;
  v_position = a_position;
}
