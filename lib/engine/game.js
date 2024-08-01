import { BLOCK_SIZE } from '../data/block.js'
import { CHUNK_SIZE } from '../data/chunk.js'
import ChunkManager, { INITIAL_CHUNKS_SIZE } from '../data/chunkManager.js'
import m4 from '../math/m4.js'
import { degToRad } from '../math/math.js'
import Program from './program.js'
import Player, { PLAYER_VELOCITY } from './player.js'
import { v3 } from '../math/v.js'
import { drawImage } from './utils.js'

export const GAME_STATES = {
  TITLE: 0,
  SINGLEPLAYER: 1,
  MULTIPLAYER: 2
}
export const DEBUG_KEY = 'e'
export const MOUSE_SENSITIVITY = 0.1
const UP = [0, 1, 0]

export default class Game {
  constructor(gl, programs) {
    window.gameDebug = true

    this.state = GAME_STATES.SINGLEPLAYER
    this.fly = false
    this.programs = programs
    this.textures = {}
    this.keys = {}
    this.cursor = {}

    // Camera
    this.fov = degToRad(60)
    this.near = 1
    this.far = CHUNK_SIZE * CHUNK_SIZE * BLOCK_SIZE * INITIAL_CHUNKS_SIZE

    this.chunkManager = new ChunkManager(gl)
    this.player = new Player()

    this.targetLocation = [0, 0, 1]
  }

  useProgram(gl, program) {
    this.programs[program].use(gl)
    return this.programs[program]
  }

  setProgram(name, program) {
    this.programs[name] = program
  }

  setTexture(gl, name, location) {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    )

    const image = new Image()
    image.addEventListener('load', () => {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    })
    image.src = location

    this.textures[name] = texture
    return texture
  }

  camera() {
    this.targetLocation = v3.add(this.player.position, this.player.direction)
    return m4.lookAt(this.player.position, this.targetLocation, UP)
  }

  processInput(gl, dt) {
    if (this.keys[DEBUG_KEY]) {
      window.gameDebug = !window.gameDebug
      this.keys[DEBUG_KEY] = false
    }

    if (!this.cursor.x && !this.cursor.y) {
      this.cursor.x = this.cursor.lastX
      this.cursor.y = this.cursor.lastY
    }

    let xOffset = this.cursor.x - this.cursor.lastX
    let yOffset = this.cursor.lastY - this.cursor.y // Reversed since y-coordinates go from bottom to top
    this.cursor.lastX = this.cursor.x
    this.cursor.lastY = this.cursor.y

    xOffset *= MOUSE_SENSITIVITY
    yOffset *= MOUSE_SENSITIVITY

    this.player.yaw += xOffset
    this.player.pitch += yOffset

    if (this.player.pitch > 179) this.player.pitch = 179
    if (this.player.pitch < -179) this.player.pitch = -179

    if (this.keys.w)
      this.player.translate(
        ...v3.multiply(this.player.direction, -PLAYER_VELOCITY * dt)
      )
    else if (this.keys.s)
      this.player.translate(
        ...v3.multiply(this.player.direction, PLAYER_VELOCITY * dt)
      )
    if (this.keys.a)
      this.player.translate(
        ...v3.multiply(
          v3.normalize(v3.cross(this.player.direction, UP)),
          PLAYER_VELOCITY * dt
        )
      )
    if (this.keys.d)
      this.player.translate(
        ...v3.multiply(
          v3.normalize(v3.cross(this.player.direction, UP)),
          -PLAYER_VELOCITY * dt
        )
      )
  }

  update(gl, dt) {
    this.chunkManager.update(gl, dt, this.player.position)
  }

  render(gl, dt) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)

    gl.clearColor(0.0, 0.0, 0.0, 1.0)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    switch (this.state) {
      case GAME_STATES.TITLE: {
      }
      case GAME_STATES.SINGLEPLAYER:
      case GAME_STATES.MULTIPLAYER: {
        const aspect = gl.canvas.width / gl.canvas.height
        let projectionMatrix = m4.perspective(
          this.fov,
          aspect,
          this.near,
          this.far
        )

        let cameraMatrix = this.camera()
        // cameraMatrix = m4.translate(cameraMatrix, ...this.player.position)

        let viewMatrix = m4.inverse(cameraMatrix)

        const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix)

        let worldMatrix = m4.identity()

        const worldViewProjectionMatrix = m4.multiply(
          viewProjectionMatrix,
          worldMatrix
        )
        const worldInverseMatrix = m4.inverse(worldMatrix)

        if (window.gameDebug) {
          this.programs.debug.use(gl)
          this.programs.debug.setUniformMatrix4fv(
            gl,
            'u_worldViewProjection',
            worldViewProjectionMatrix
          )
          this.programs.debug.setUniformMatrix4fv(
            gl,
            'u_worldInverseTranspose',
            worldInverseMatrix,
            true
          )
          this.programs.debug.setUniform3fv(
            gl,
            'u_lightDir',
            v3.normalize([0.4, 1.0, 1.0])
          )
        } else {
          this.programs.texture.use(gl)
          this.programs.texture.setUniformMatrix4fv(
            gl,
            'u_worldViewProjection',
            worldViewProjectionMatrix
          )
          this.programs.texture.setUniformMatrix4fv(
            gl,
            'u_worldInverseTranspose',
            worldInverseMatrix,
            true
          )
          this.programs.texture.setUniform3fv(
            gl,
            'u_lightDir',
            v3.normalize([0.4, 1.0, 1.0])
          )
        }

        for (let idx of this.chunkManager.renderChunks) {
          const chunk = this.chunkManager.chunks[idx]
          chunk.render(
            gl,
            dt,
            window.gameDebug ? this.programs.debug : this.programs.texture
          )
        }

        // drawImage(
        //   gl,
        //   this.programs.img,
        //   this.textures.cursor,
        //   gl.canvas.width / 2 - 24,
        //   gl.canvas.height / 2 - 24,
        //   48,
        //   48
        // )
      }
    }
  }

  static async init(gl) {
    const game = new Game(gl, {
      debug: await Program.create(
        gl,
        '/shaders/vertex/debug.vs',
        '/shaders/fragment/debug.fs',
        ['a_position', 'a_color', 'a_normal'],
        ['u_worldViewProjection', 'u_worldInverseTranspose', 'u_lightDir']
      ),
      texture: await Program.create(
        gl,
        '/shaders/vertex/texture.vs',
        '/shaders/fragment/texture.fs',
        ['a_position', 'a_texcoord', 'a_color', 'a_alpha', 'a_normal'],
        [
          'u_worldViewProjection',
          'u_worldInverseTranspose',
          'u_texture',
          'u_lightDir'
        ]
      ),
      img: await Program.create(
        gl,
        '/shaders/vertex/img.vs',
        '/shaders/fragment/img.fs',
        ['a_position', 'a_texcoord'],
        ['u_resolution', 'u_texture', 'u_color']
      )
    })
    game.setTexture(gl, 'atlas', '/textures/atlas.png')
    game.setTexture(gl, 'cursor', '/textures/cursor.png')
    game.setTexture(gl, 'logo', '/textures/logo.png')
    return game
  }
}
