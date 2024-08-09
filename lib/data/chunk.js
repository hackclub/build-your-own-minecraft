import Block, { BLOCK_SIZE, BLOCK_TYPES, MAX_LIGHT } from './block.js'
import perlin from '../math/noise.js'
import { updateBuffer } from '../engine/program.js'

export const CHUNK_SIZE = 48
export const CHUNK_FLAGS = {
  BUILD_VERTICES: 0,
  BUILD_COLORS: 1,
  BUILD_TEXTURES: 2,
  BUILD_NORMALS: 3,
  BUILD_LIGHTING: 4,
  DEBUG: 5
}

export default class Chunk {
  constructor(gl, x = 0, y = 0, z = 0) {
    this.x = x
    this.y = y
    this.z = z
    this.a = 1.0

    this.flags = {
      [CHUNK_FLAGS.DEBUG]: window.gameDebug
    }

    this.blocks = []
    this.heightmap = []

    for (let x = 0; x < CHUNK_SIZE; x++) {
      let row = []
      for (let y = 0; y < CHUNK_SIZE; y++) {
        let col = []
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const block = new Block()
          col.push(block)
        }
        row.push(col)
      }
      this.blocks.push(row)
      this.heightmap.push(new Array(CHUNK_SIZE).fill(0))
    }

    this.vertices = {
      solid: gl.createBuffer(),
      transparent: gl.createBuffer()
    }
    this.colors = {
      solid: gl.createBuffer(),
      transparent: gl.createBuffer()
    }
    this.textures = {
      solid: gl.createBuffer(),
      transparent: gl.createBuffer()
    }
    this.normals = {
      solid: gl.createBuffer(),
      transparent: gl.createBuffer()
    }
    this.lighting = {
      solid: gl.createBuffer(),
      transparent: gl.createBuffer()
    }

    this.bufferSizes = {
      solid: 0,
      transparent: 0
    }
  }

  get voxelPosition() {
    return [this.x, this.y, this.z]
  }

  get worldPosition() {
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

  light(x, y, z) {
    try {
      return this.blocks[x][y][z].light
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

  remove(gl, x, y, z) {
    this.blocks[x][y][z].set(BLOCK_TYPES.AIR, false)
    this.buildBuffer(gl)
  }

  add(gl, x, y, z, type) {
    this.blocks[x][y][z].set(type)
    if (y > this.heightmap[x][z]) this.heightmap[x][z] = y
  }

  buildBuffer(
    gl,
    flags = {
      [CHUNK_FLAGS.BUILD_VERTICES]: true,
      [CHUNK_FLAGS.BUILD_COLORS]: true,
      [CHUNK_FLAGS.BUILD_TEXTURES]: true,
      [CHUNK_FLAGS.BUILD_NORMALS]: true,
      [CHUNK_FLAGS.BUILD_LIGHTING]: true
    }
  ) {
    this.flags[CHUNK_FLAGS.DEBUG] = window.gameDebug

    let vertices = []
    let colors = []
    let textures = []
    let normals = []
    let lighting = []

    const position = this.worldPosition

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const block = this.blocks[x][y][z]
          if (block.transparent) continue
          if (
            x !== 0 &&
            y !== 0 &&
            z !== 0 &&
            x !== CHUNK_SIZE - 1 &&
            y <= this.heightmap[x][z] - 3 &&
            z !== CHUNK_SIZE - 1
          ) {
            // Check if there's a neighbor above in this case
            continue
            // const neighborAbove = this.block(x, y + 1, z)
            // if (neighborAbove && neighborAbove.active) continue
          }
          if (block.active) {
            if (flags[CHUNK_FLAGS.BUILD_VERTICES])
              vertices.push(
                ...block.vertices(
                  position[0] + x * BLOCK_SIZE,
                  position[1] + y * BLOCK_SIZE,
                  position[2] + z * BLOCK_SIZE
                )
              )
            if (flags[CHUNK_FLAGS.BUILD_COLORS]) colors.push(...block.colors)
            if (flags[CHUNK_FLAGS.BUILD_TEXTURES])
              textures.push(...block.textures)
            if (flags[CHUNK_FLAGS.BUILD_NORMALS]) normals.push(...block.normals)
            if (flags[CHUNK_FLAGS.BUILD_LIGHTING])
              lighting.push(...block.lighting)
          }
        }
      }
    }

    if (flags[CHUNK_FLAGS.BUILD_VERTICES])
      updateBuffer(gl, this.vertices.solid, vertices)
    if (flags[CHUNK_FLAGS.BUILD_COLORS])
      updateBuffer(gl, this.colors.solid, colors)
    if (flags[CHUNK_FLAGS.BUILD_TEXTURES])
      updateBuffer(gl, this.textures.solid, textures)
    if (flags[CHUNK_FLAGS.BUILD_NORMALS])
      updateBuffer(gl, this.normals.solid, normals)
    if (flags[CHUNK_FLAGS.BUILD_LIGHTING])
      updateBuffer(gl, this.lighting.solid, lighting)

    if (flags[CHUNK_FLAGS.BUILD_VERTICES])
      this.bufferSizes.solid = vertices.length
  }

  render(gl, dt, program) {
    program.setAttrib(gl, 'a_position', this.vertices.solid, { size: 3 })
    program.setAttrib(gl, 'a_color', this.colors.solid, { size: 3 })
    program.setAttrib(gl, 'a_normal', this.normals.solid, { size: 3 })
    if (!window.gameDebug) {
      program.setAttrib(gl, 'a_texcoord', this.textures.solid, { size: 2 })
      program.setAttrib(gl, 'a_lighting', this.lighting.solid, { size: 1 })
    }
    gl.drawArrays(
      window.gameDebug ? gl.LINES : gl.TRIANGLES,
      0,
      this.bufferSizes.solid / 3
    )
  }

  // Shaping
  noise() {
    let water = []
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const height =
          perlin(
            (x / CHUNK_SIZE + this.x) * CHUNK_SIZE,
            (z / CHUNK_SIZE + this.z) * CHUNK_SIZE
          ) * CHUNK_SIZE
        let y
        for (y = 0; y <= height; y++) {
          this.blocks[x][y][z].set(BLOCK_TYPES.DIRT)
        }
        this.blocks[x][y][z].set(BLOCK_TYPES.DIRT_GRASS)
        if (Math.round(height) === CHUNK_SIZE / 4 - 1)
          this.blocks[x][y][z].set(BLOCK_TYPES.SAND)
        if (y < CHUNK_SIZE / 4) {
          water.push([x, y, z])
        }
        this.heightmap[x][z] = y
      }
    }

    for (let [x, y, z] of water) {
      for (let wy = CHUNK_SIZE / 4; wy > y; wy--) {
        this.blocks[x][wy][z].set(BLOCK_TYPES.WATER)
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
