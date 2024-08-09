export const resize = canvas => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

export const loadImage = location =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', () => reject())
    image.src = location
  })

export const drawImage = (
  gl,
  imgProgram,
  img,
  sx,
  sy,
  sWidth,
  sHeight,
  dx,
  dy,
  dWidth,
  dHeight,
  imgWidth,
  imgHeight,
  color = [1.0, 1.0, 1.0, 1.0]
) => {
  gl.bindTexture(gl.TEXTURE_2D, img)
  imgProgram.use(gl)
  // prettier-ignore
  imgProgram.setBuffer(gl, "a_position", [
    dx, dy,
    dx, dy + dHeight,
    dx + dWidth, dy,
    dx + dWidth, dy,
    dx, dy + dHeight,
    dx + dWidth, dy + dHeight
  ], {
    size: 2,
    usage: gl.STATIC_DRAW
  })
  // prettier-ignore
  imgProgram.setBuffer(gl, "a_texcoord", [
    sx / imgWidth, sy / imgHeight,
    sx / imgWidth, (sy + sHeight) / imgHeight,
    (sx + sWidth) / imgWidth, sy / imgHeight,
    (sx + sWidth) / imgWidth, sy / imgHeight,
    sx / imgWidth, (sy + sHeight) / imgHeight,
    (sx + sWidth) / imgWidth, (sy + sHeight) / imgHeight
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
  imgProgram.setUniform4fv(gl, 'u_color', color)
  imgProgram.setUniform1i(gl, 'u_texture', img)
  gl.drawArrays(gl.TRIANGLES, 0, 6)
}

export const drawRect = (
  gl,
  shapeProgram,
  x,
  y,
  width,
  height,
  color = [1.0, 1.0, 1.0, 1.0]
) => {}

export const drawCube = (
  gl,
  shapeProgram,
  x,
  y,
  z,
  size,
  color = [1.0, 1.0, 1.0, 1.0]
) => {}
