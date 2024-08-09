#version 300 es

precision highp float;

in vec4 v_color;

out vec4 color;

void main() {
  color = v_color;
}
