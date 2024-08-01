import Block, { BLOCK_SIZE, BLOCK_TYPES } from './block.js'
import perlin from '../math/noise.js'
import { updateBuffer } from '../engine/program.js'
import { random } from '../math/math.js'

export const CHUNK_SIZE = 36
export const CHUNK_FLAGS = {}

export default class Chunk {
  constructor(
    gl,
    x = 0,
    y = 0,
    z = 0,
    color = [Math.random(), Math.random(), Math.random()]
  ) {
    this.x = x
    this.y = y
    this.z = z
    this.a = 1.0

    this.blocks = []
    for (let x = 0; x < CHUNK_SIZE; x++) {
      let row = []
      for (let y = 0; y < CHUNK_SIZE; y++) {
        let col = []
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const block = new Block()
          block.rgb = color
          col.push(block)
        }
        row.push(col)
      }
      this.blocks.push(row)
    }

    this.vertices = gl.createBuffer()
    this.colors = gl.createBuffer()
    this.textures = gl.createBuffer()
    this.normals = gl.createBuffer()

    this.bufferSize = 0
  }

  get position() {
    return [
      this.x * CHUNK_SIZE * BLOCK_SIZE,
      this.y * CHUNK_SIZE * BLOCK_SIZE,
      this.z * CHUNK_SIZE * BLOCK_SIZE
    ]
  }

  block(x, y, z) {
    try {
      return this.blocks[x][y][z]
    } catch {
      return undefined
    }
  }

  neighbors(x, y, z) {
    // Return a list of blocks that neighbor the block at x, y, z.
    // Every block has max 26 neighbors, each represented by [x, y, z]: block
    return {
      // Bottom layer
      [[x, y - 1, z]]: this.block(x, y - 1, z),
      [[x, y - 1, z - 1]]: this.block(x, y - 1, z - 1),
      [[x, y - 1, z + 1]]: this.block(x, y - 1, z + 1),
      [[x - 1, y - 1, z]]: this.block(x - 1, y - 1, z),
      [[x - 1, y - 1, z - 1]]: this.block(x - 1, y - 1, z - 1),
      [[x - 1, y - 1, z + 1]]: this.block(x - 1, y - 1, z + 1),
      [[x + 1, y - 1, z]]: this.block(x + 1, y - 1, z),
      [[x + 1, y - 1, z - 1]]: this.block(x + 1, y - 1, z - 1),
      [[x + 1, y - 1, z + 1]]: this.block(x + 1, y - 1, z + 1),

      // Top layer
      [[x, y + 1, z]]: this.block(x, y + 1, z),
      [[x, y + 1, z - 1]]: this.block(x, y + 1, z - 1),
      [[x, y + 1, z + 1]]: this.block(x, y + 1, z + 1),
      [[x - 1, y + 1, z]]: this.block(x - 1, y + 1, z),
      [[x - 1, y + 1, z - 1]]: this.block(x - 1, y + 1, z - 1),
      [[x - 1, y + 1, z + 1]]: this.block(x - 1, y + 1, z + 1),
      [[x + 1, y + 1, z]]: this.block(x + 1, y + 1, z),
      [[x + 1, y + 1, z - 1]]: this.block(x + 1, y + 1, z - 1),
      [[x + 1, y + 1, z + 1]]: this.block(x + 1, y + 1, z + 1),

      // Middle layer
      [[x, y, z - 1]]: this.block(x, y, z - 1),
      [[x, y, z + 1]]: this.block(x, y, z + 1),
      [[x - 1, y, z]]: this.block(x - 1, y, z),
      [[x - 1, y, z - 1]]: this.block(x - 1, y, z - 1),
      [[x - 1, y, z + 1]]: this.block(x - 1, y, z + 1),
      [[x + 1, y, z]]: this.block(x + 1, y, z),
      [[x + 1, y, z - 1]]: this.block(x + 1, y, z - 1),
      [[x + 1, y, z + 1]]: this.block(x + 1, y, z + 1)
    }
  }

  buildBuffer(gl) {
    let vertices = []
    let colors = []
    let textures = []
    let normals = []

    const position = this.position

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const block = this.block(x, y, z)
          if (
            x !== 0 &&
            y !== 0 &&
            z !== 0 &&
            x !== CHUNK_SIZE - 1 &&
            y !== CHUNK_SIZE - 1 &&
            z !== CHUNK_SIZE - 1
          ) {
            // Check if there's a neighbor above in this case
            const neighborAbove = this.block(x, y + 1, z)
            if (neighborAbove && neighborAbove.active) continue
          }
          if (block.active) {
            vertices.push(
              ...block.vertices(
                position[0] + x * BLOCK_SIZE,
                position[1] + y * BLOCK_SIZE,
                position[2] + z * BLOCK_SIZE
              )
            )
            colors.push(...block.colors)
            textures.push(...block.textures)
            normals.push(...block.normals)
          }
        }
      }
    }

    updateBuffer(gl, this.vertices, vertices)
    updateBuffer(gl, this.colors, colors)
    updateBuffer(gl, this.textures, textures)
    updateBuffer(gl, this.normals, normals)

    this.bufferSize = vertices.length
  }

  render(gl, dt, program) {
    program.setAttrib(gl, 'a_position', this.vertices, { size: 3 })
    program.setAttrib(gl, 'a_color', this.colors, { size: 3 })
    program.setAttrib(gl, 'a_normal', this.normals, { size: 3 })
    if (!window.gameDebug) {
      program.setAttrib(gl, 'a_texcoord', this.textures, { size: 2 })
    }
    gl.drawArrays(
      window.gameDebug ? gl.LINES : gl.TRIANGLES,
      0,
      this.bufferSize / 3
    )
  }

  // Shaping
  noise() {
    let waterHeight = 0
    let water = []
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        let height =
          perlin(
            (x / CHUNK_SIZE + this.x) * CHUNK_SIZE,
            (z / CHUNK_SIZE + this.z) * CHUNK_SIZE
          ) * CHUNK_SIZE
        if (height < CHUNK_SIZE / 4) {
          waterHeight = height
          water.push([x, z])
        } else {
          for (let y = CHUNK_SIZE - 1; y > height; y--) {
            this.blocks[x][y][z].active = false
          }
          height = Math.round(height)
          const depth = random(2, 5)
          for (let y = height; y > height - depth; y--) {
            this.blocks[x][y][z].type = BLOCK_TYPES.DIRT_GRASS
          }
        }
      }
    }

    for (let [x, z] of water) {
      for (let y = CHUNK_SIZE - 1; y >= 0; y--) {
        if (y > waterHeight) this.blocks[x][y][z].active = false
        else this.blocks[x][y][z].type = BLOCK_TYPES.WATER
      }
    }
  }

  sphere() {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          if (
            Math.sqrt(
              (x - CHUNK_SIZE / 2) * (x - CHUNK_SIZE / 2) +
                (y - CHUNK_SIZE / 2) * (y - CHUNK_SIZE / 2) +
                (z - CHUNK_SIZE / 2) * (z - CHUNK_SIZE / 2)
            ) <=
            CHUNK_SIZE / 2
          ) {
            this.blocks[x][y][z].active = true
          } else this.blocks[x][y][z].active = false
        }
      }
    }
  }
}
