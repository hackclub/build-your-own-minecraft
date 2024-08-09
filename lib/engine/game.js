import { BLOCK_SIZE, BLOCK_TYPES } from '../data/block.js'
import { CHUNK_FLAGS, CHUNK_SIZE } from '../data/chunk.js'
import ChunkManager, { INITIAL_CHUNKS_SIZE } from '../data/chunkManager.js'
import m4 from '../math/m4.js'
import { degToRad } from '../math/math.js'
import Program from './program.js'
import Player, { PLAYER_VELOCITY } from './player.js'
import { v3 } from '../math/v.js'
import { drawImage, loadImage } from './utils.js'
import { repeatArray } from '../misc.js'

export const GAME_STATES = {
  TITLE: 0,
  SINGLEPLAYER: 1,
  MULTIPLAYER: 2
}
export const DEBUG_KEY = 'e'
export const MOUSE_SENSITIVITY = 0.1
export const GRAVITY = -9.8
const UP = [0, 1, 0]

export default class Game {
  constructor(gl, programs, seed = Math.random()) {
    window.gameDebug = true
    window.seed = seed

    this.state = GAME_STATES.MULTIPLAYER
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

  setTexture(
    gl,
    name,
    image,
    callback = gl => {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    }
  ) {
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
    callback(gl)

    this.textures[name] = texture
    return texture
  }

  camera() {
    this.targetLocation = v3.add(
      this.player.worldPosition,
      this.player.direction
    )
    return m4.lookAt(this.player.worldPosition, this.targetLocation, UP)
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
        ...v3.multiply(this.player.direction, -this.player.velocity * dt)
      )
    else if (this.keys.s)
      this.player.translate(
        ...v3.multiply(this.player.direction, this.player.velocity * dt)
      )
    if (this.keys.a)
      this.player.translate(
        ...v3.multiply(
          v3.normalize(v3.cross(this.player.direction, UP)),
          this.player.velocity * dt
        )
      )
    else if (this.keys.d)
      this.player.translate(
        ...v3.multiply(
          v3.normalize(v3.cross(this.player.direction, UP)),
          -this.player.velocity * dt
        )
      )

    const selection = Object.keys(this.keys).filter(
      key => key[0] >= '0' && key[0] <= '9' && this.keys[key]
    )
    if (selection.length) this.player.selection = Number(selection[0]) - 1

    if (this.cursor.clickX && this.cursor.clickY && this.player.touching) {
      const { chunk, position } = this.player.touching
      const add = [position[0], position[1] + 1, position[2]]
      if (this.keys.Control) {
        // Determine direction to extend, based on direction from player
        chunk.add(gl, ...add, BLOCK_TYPES.LANTERN)
        this.chunkManager.lightQueue.push({ chunk, position: add })
      } else chunk.remove(gl, ...position)
    }

    this.cursor.clickX = undefined
    this.cursor.clickY = undefined
  }

  update(gl, dt) {
    this.chunkManager.update(
      gl,
      dt,
      this.player.worldPosition,
      this.player.direction
    )

    if (!this.player.flying) {
      const [x, y, z] = this.player.worldPosition
      const touching = this.chunkManager.worldToVoxel(x, y, z)
      if (!touching || !touching.block.active) {
        const { chunk, block, position } =
          this.chunkManager.worldToVoxel(x, y, z) ||
          this.chunkManager.worldToVoxel(x, 0, z)
        const closestY =
          chunk.heightmap[position[0]][position[1]] * BLOCK_SIZE + BLOCK_SIZE
        console.log(y, closestY)
        let dy = this.player.velocity * dt * GRAVITY
        if (y + dy < closestY) dy = y - closestY
        this.player.translate(0, -dy, 0)
      }
    }

    // Get voxel player is pointing at, if any
    this.player.pointing(this.chunkManager)
  }

  render(gl, dt) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)

    gl.clearColor(0.0, 0.0, 0.0, 1.0)

    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT)

    gl.blendFunc(gl.SRC_ALPHA, gl.ZERO)

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

        this.programs.shape.use(gl)
        this.programs.shape.setUniformMatrix4fv(
          gl,
          'u_worldViewProjection',
          worldViewProjectionMatrix
        )
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
          if (window.nol)
            this.programs.texture.setUniform1i(gl, 'u_lighting', 0)
          else this.programs.texture.setUniform1i(gl, 'u_lighting', 1)

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

        // Draw skybox
        gl.depthFunc(gl.LEQUAL) // Let quad pass the depth test at 1.0

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

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        // Draw UI elements: cursor, inventory, inventory selection, selected block
        drawImage(
          gl,
          this.programs.img,
          this.textures.cursor,
          0,
          0,
          48,
          48,
          gl.canvas.width / 2 - 24,
          gl.canvas.height / 2 - 24,
          48,
          48,
          48,
          48,
          [1.0, 1.0, 1.0, 0.4]
        )

        this.player.renderInventory(gl, this.programs, this.textures)
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
        [
          'a_position',
          'a_texcoord',
          'a_color',
          'a_alpha',
          'a_normal',
          'a_lighting'
        ],
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
      shape: await Program.create(
        gl,
        '/shaders/vertex/shape.vs',
        '/shaders/fragment/shape.fs',
        ['a_position', 'a_color'],
        ['u_worldViewProjection']
      ),
      sky: await Program.create(
        gl,
        '/shaders/vertex/sky.vs',
        '/shaders/fragment/sky.fs',
        ['a_position'],
        ['u_skybox', 'u_worldViewDirectionProjectionInverse']
      )
    })
    game.setTexture(gl, 'atlas', await loadImage('/textures/atlas.png'), gl => {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 3)
      gl.generateMipmap(gl.TEXTURE_2D)
    })
    game.setTexture(
      gl,
      'cursor',
      await loadImage('/textures/cursor.png'),
      gl => {
        gl.generateMipmap(gl.TEXTURE_2D)
      }
    )
    game.setTexture(gl, 'gui', await loadImage('/textures/gui.png'))
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
