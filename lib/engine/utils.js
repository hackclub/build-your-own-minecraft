export const resize = canvas => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

export const drawImage = (
  gl,
  imgProgram,
  img,
  x,
  y,
  width,
  height,
  color = [1.0, 1.0, 1.0, 1.0]
) => {
  gl.bindTexture(gl.TEXTURE_2D, img)
  imgProgram.use(gl)
  // prettier-ignore
  imgProgram.setBuffer(gl, "a_position", [
    x, y,
    x, y + height,
    x + width, y,
    x + width, y,
    x, y + height,
    x + width, y + height
  ], {
  size: 2,
    usage: gl.STATIC_DRAW
})
  // prettier-ignore
  imgProgram.setBuffer(gl, "a_texcoord", [
  0.0, 0.0,
  1.0, 0.0,
  0.0, 1.0,
  0.0, 1.0,
  1.0, 0.0,
  1.0, 1.0,
], {
  size: 2,
  usage: gl.STATIC_DRAW
})
  imgProgram.enableAttrib(gl, 'a_position')
  imgProgram.enableAttrib(gl, 'a_texcoord')
  imgProgram.setUniform2fv(gl, 'u_resolution', [
    gl.canvas.width,
    gl.canvas.height
  ])
  imgProgram.setUniform2fv(gl, 'u_color', color)
  imgProgram.setUniform1i(gl, 'u_texture', img)
  gl.drawArrays(gl.TRIANGLES, 0, 6)
}
