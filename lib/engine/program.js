export const createShader = (gl, type, source) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(
      `Shader source:\n\n${source}\n${gl.getShaderInfoLog(shader)}`
    )
  return shader
}

export const createProgram = (gl, vertex, fragment) => {
  const program = gl.createProgram()
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program))
  return program
}

export const loadProgram = async (gl, vertexSource, fragmentSource) => {
  const vertex = await (await fetch(vertexSource)).text()
  const fragment = await (await fetch(fragmentSource)).text()
  return createProgram(
    gl,
    createShader(gl, gl.VERTEX_SHADER, vertex),
    createShader(gl, gl.FRAGMENT_SHADER, fragment)
  )
}

export const updateBuffer = (gl, buffer, data, usage) => {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(data),
    usage ? usage : gl.DYNAMIC_DRAW
  )
}

export default class Program {
  constructor(program, attributes = {}, uniforms = {}) {
    this.program = program
    this.attributes = attributes
    this.uniforms = uniforms
  }

  use(gl) {
    gl.useProgram(this.program)
    return this.program
  }

  getBufferParameter(gl, location, parameter) {
    const attr = this.attributes[location]
    gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer)
    return gl.getBufferParameter(gl.ARRAY_BUFFER, parameter)
  }

  setBuffer(gl, location, buffer, opts = {}) {
    // opts = extra data that will be used later to store buffer at attribute.
    // includes: size (required), type || gl.FLOAT, normalize || false, stride || 0, offset || 0
    const attr = this.attributes[location]
    if (!opts.size && !attr.size)
      throw new Error(`opts.size needs to be defined for buffer ${location}`)
    gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(buffer),
      opts.usage ? opts.usage : gl.DYNAMIC_DRAW
    )
    for (const [key, value] of Object.entries(opts))
      this.attributes[location][key] = value
  }

  setSubBuffer(gl, location, offset, buffer, opts = {}) {
    const attr = this.attributes[location]
    gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, offset, new Float32Array(buffer))
    for (const [key, value] of Object.entries(opts))
      this.attributes[location][key] = value
  }

  enableAttrib(gl, location) {
    const attr = this.attributes[location]
    gl.enableVertexAttribArray(attr.location)
    gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer)
    gl.vertexAttribPointer(
      attr.location,
      attr.size,
      attr.type || gl.FLOAT,
      attr.normalize || false,
      attr.stride || 0,
      attr.offset || 0
    )
  }

  setAttrib(gl, location, buffer, opts = {}) {
    const attr = this.attributes[location]
    gl.enableVertexAttribArray(attr.location)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.vertexAttribPointer(
      attr.location,
      opts.size || attr.size,
      opts.type || attr.type || gl.FLOAT,
      opts.normalize || attr.normalize || false,
      opts.stride || attr.stride || 0,
      opts.offset || attr.offset || 0
    )
  }

  getUniform(gl, location) {
    return gl.getUniform(this.program, this.uniforms[location].location)
  }

  setUniform1i(gl, location, val) {
    gl.uniform1i(this.uniforms[location].location, val)
  }

  setUniform2fv(gl, location, val) {
    gl.uniform2fv(this.uniforms[location].location, val)
  }

  setUniform3fv(gl, location, val) {
    gl.uniform3fv(this.uniforms[location].location, val)
  }

  setUniform4fv(gl, location, val) {
    gl.uniform4fv(this.uniforms[location].location, val)
  }

  setUniformMatrix4fv(gl, location, val, transpose = false) {
    gl.uniformMatrix4fv(this.uniforms[location].location, transpose, val)
  }

  static async create(
    gl,
    vertexSource,
    fragmentSource,
    attributeNames = [],
    uniformNames = []
  ) {
    const program = await loadProgram(gl, vertexSource, fragmentSource)

    let attributes = {}
    for (let attr of attributeNames)
      attributes[attr] = {
        location: gl.getAttribLocation(program, attr),
        buffer: gl.createBuffer()
      }

    let uniforms = {}
    for (let uniform of uniformNames)
      uniforms[uniform] = {
        location: gl.getUniformLocation(program, uniform)
      }

    return new Program(program, attributes, uniforms)
  }
}
