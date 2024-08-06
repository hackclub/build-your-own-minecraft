import { BLOCK_SIZE } from '../data/block.js'
import { CHUNK_FLAGS, CHUNK_SIZE } from '../data/chunk.js'
import ChunkManager, { INITIAL_CHUNKS_SIZE } from '../data/chunkManager.js'
import m4 from '../math/m4.js'
import { degToRad } from '../math/math.js'
import Program from './program.js'
import Player, { PLAYER_VELOCITY } from './player.js'
import { v3 } from '../math/v.js'
import { drawImage, loadImage } from './utils.js'

export const GAME_STATES = {
  TITLE: 0,
  SINGLEPLAYER: 1,
  MULTIPLAYER: 2
}
export const DEBUG_KEY = 'e'
export const MOUSE_SENSITIVITY = 0.1
export const GRAVITY = 0.9
const UP = [0, 1, 0]

export default class Game {
  constructor(gl, programs, seed = Math.random()) {
    window.gameDebug = true
    window.seed = seed

    this.state = GAME_STATES.MULTIPLAYER
    this.fly = false
    this.programs = programs
    this.textures = {}
    this.keys = {}
    this.cursor = {}

    // Camera
    this.fov = degToRad(60)
    this.near = 1
    this.far = CHUNK_SIZE * CHUNK_SIZE * BLOCK_SIZE * INITIAL_CHUNKS_SIZE

    this.sky = []
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

  setTexture(gl, name, image) {
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

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

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
      for (let coord of this.chunkManager.renderChunks) {
        const chunk = this.chunkManager.chunks[coord]
        if (chunk.flags[CHUNK_FLAGS.DEBUG] !== window.gameDebug) {
          chunk.buildBuffer(gl, {
            [CHUNK_FLAGS.BUILD_COLORS]: true
          })
        }
      }
    }

    if (!this.cursor.x && !this.cursor.y) {
      this.cursor.x = this.cursor.lastX
      this.cursor.y = this.cursor.lastY
    }

    let xOffset = this.cursor.x - this.cursor.lastX
    let yOffset = this.cursor.lastY - this.cursor.y
    this.cursor.lastX = this.cursor.x
    this.cursor.lastY = this.cursor.y

    xOffset *= MOUSE_SENSITIVITY
    yOffset *= MOUSE_SENSITIVITY

    this.player.yaw += xOffset
    this.player.pitch += yOffset

    if (this.player.pitch > 89) this.player.pitch = 89
    if (this.player.pitch < -89) this.player.pitch = -89

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

    if (this.keys.Space) {
      console.log('true')
    }
  }

  update(gl, dt) {
    this.chunkManager.update(
      gl,
      dt,
      this.player.position,
      this.player.direction
    )

    // Get voxel player is pointing at, if any
    this.player.pointing(this.chunkManager)
  }

  render(gl, dt) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)

    gl.clearColor(0.0, 0.0, 0.0, 1.0)

    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT)

    switch (this.state) {
      case GAME_STATES.TITLE: {
      }
      case GAME_STATES.SINGLEPLAYER:
      case GAME_STATES.MULTIPLAYER: {
        const aspect = gl.canvas.width / gl.canvas.height
        const projectionMatrix = m4.perspective(
          this.fov,
          aspect,
          this.near,
          this.far
        )
        const cameraMatrix = this.camera()
        const viewMatrix = m4.inverse(cameraMatrix)
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
            v3.normalize([-1.0, 1.0, -1.0])
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
            v3.normalize([-1.0, 1.0, -1.0])
          )
          this.programs.texture.setUniform1i(
            gl,
            'u_texture',
            this.textures.atlas
          )
          if (window.lighting)
            this.programs.texture.setUniform1i(gl, 'u_lighting', 1)
          else this.programs.texture.setUniform1i(gl, 'u_lighting', 0)

          gl.bindTexture(gl.TEXTURE_2D, this.textures.atlas)
        }

        for (let coord of this.chunkManager.renderChunks) {
          const chunk = this.chunkManager.chunks[coord]
          chunk.render(
            gl,
            dt,
            window.gameDebug ? this.programs.debug : this.programs.texture
          )
        }

        // Let quad pass the depth test at 1.0
        gl.depthFunc(gl.LEQUAL)

        this.programs.sky.use(gl)
        this.programs.sky.enableAttrib(gl, 'a_position')

        viewMatrix[12] = 0
        viewMatrix[13] = 0
        viewMatrix[14] = 0
        this.programs.sky.setUniformMatrix4fv(
          gl,
          'u_worldViewDirectionProjectionInverse',
          m4.inverse(m4.multiply(projectionMatrix, viewMatrix))
        )
        this.programs.sky.setUniform1i(gl, 'u_skybox', this.textures.skybox)

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.textures.skybox)
        gl.drawArrays(gl.TRIANGLES, 0, 1 * 6)

        drawImage(
          gl,
          this.programs.img,
          this.textures.cursor,
          gl.canvas.width / 2 - 24,
          gl.canvas.height / 2 - 24,
          48,
          48,
          [1.0, 1.0, 1.0, 0.1]
        )
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
          'u_lightDir',
          'u_lighting'
        ]
      ),
      img: await Program.create(
        gl,
        '/shaders/vertex/img.vs',
        '/shaders/fragment/img.fs',
        ['a_position', 'a_texcoord'],
        ['u_resolution', 'u_texture', 'u_color']
      ),
      sky: await Program.create(
        gl,
        '/shaders/vertex/sky.vs',
        '/shaders/fragment/sky.fs',
        ['a_position'],
        ['u_skybox', 'u_worldViewDirectionProjectionInverse']
      )
    })
    game.setTexture(gl, 'atlas', await loadImage('/textures/atlas.png'))
    game.setTexture(gl, 'cursor', await loadImage('/textures/cursor.png'))
    game.setTexture(gl, 'logo', await loadImage('/textures/logo.png'))

    // Load sky texture into cubemap
    const side = await loadImage('/textures/sky-side.png')
    const bottom = await loadImage('/textures/sky-bottom.png')
    const skybox = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skybox)
    for (let face of [
      { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, texture: side },
      { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, texture: side },
      { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, texture: side },
      { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, texture: side },
      { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, texture: side },
      { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, texture: side }
    ]) {
      gl.texImage2D(
        face.target,
        0,
        gl.RGBA,
        512,
        512,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        face.texture
      )
    }
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
    gl.texParameteri(
      gl.TEXTURE_CUBE_MAP,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    )
    game.textures.skybox = skybox
    game.programs.sky.setBuffer(
      gl,
      'a_position',
      [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0],
      { size: 2 }
    )

    return game
  }
}
