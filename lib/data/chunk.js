import Block, { BLOCK_SIZE, BLOCK_TYPES } from './block.js'
import perlin from '../math/noise.js'
import { updateBuffer } from '../engine/program.js'
import { map, randomWithSeed } from '../math/math.js'
import { assert } from '../misc.js'

export const CHUNK_SIZE = 32
export const CHUNK_FLAGS = {
  BUILD_VERTICES: 0,
  BUILD_COLORS: 1,
  BUILD_TEXTURES: 2,
  BUILD_LIGHTING: 4,
  DEBUG: 5
}

export default class Chunk {
  constructor(gl, x = 0, y = 0, z = 0, defaultOpts = [false, BLOCK_TYPES.AIR]) {
    this.x = x
    this.y = y
    this.z = z
    this.a = 1.0

    this.flags = {
      [CHUNK_FLAGS.DEBUG]: window.gameDebug
    }

    this.blocks = []
    this.heightmap = new Array(CHUNK_SIZE)
      .fill(null)
      .map(() => new Array(CHUNK_SIZE).fill(0))
    // this.heightmap = new Array(CHUNK_SIZE).fill(new Array(CHUNK_SIZE).fill(0))

    for (let x = 0; x < CHUNK_SIZE; x++) {
      let row = []
      for (let y = 0; y < CHUNK_SIZE; y++) {
        let col = []
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const block = new Block(...defaultOpts)
          col.push(block)
        }
        row.push(col)
      }
      this.blocks.push(row)
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
    this.lighting = {
      solid: gl.createBuffer(),
      transparent: gl.createBuffer()
    }
    this.depths = {
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

  get voxelPositionHash() {
    return this.voxelPosition.toString()
  }

  get worldPosition() {
    return [
      this.x * CHUNK_SIZE * BLOCK_SIZE,
      this.y * CHUNK_SIZE * BLOCK_SIZE,
      this.z * CHUNK_SIZE * BLOCK_SIZE
    ]
  }

  get worldPositionHash() {
    return this.worldPosition.toString()
  }

  block(x, y, z) {
    try {
      return this.blocks[x][y][z]
    } catch {
      return undefined
    }
  }

  neighbors(x, y, z, radius = 1) {
    // Return a list of blocks that neighbor the block at x, y, z.
    // Every block has max 26 neighbors, each represented by [x, y, z]: block
    // Needs to be augmented by a chunk manager's neigbor() method for edge blocks
    let neighbors = {}
    for (let i = 1; i <= radius; i++) {
      neighbors = {
        ...neighbors,

        // Bottom layer
        [[x, y - i, z]]: this.block(x, y - i, z),
        [[x, y - i, z - i]]: this.block(x, y - i, z - i),
        [[x, y - i, z + i]]: this.block(x, y - i, z + i),
        [[x - i, y - i, z]]: this.block(x - i, y - i, z),
        [[x - i, y - i, z - i]]: this.block(x - i, y - i, z - i),
        [[x - i, y - i, z + i]]: this.block(x - i, y - i, z + i),
        [[x + i, y - i, z]]: this.block(x + i, y - i, z),
        [[x + i, y - i, z - i]]: this.block(x + i, y - i, z - i),
        [[x + i, y - i, z + i]]: this.block(x + i, y - i, z + i),

        // Top layer
        [[x, y + i, z]]: this.block(x, y + i, z),
        [[x, y + i, z - i]]: this.block(x, y + i, z - i),
        [[x, y + i, z + i]]: this.block(x, y + i, z + i),
        [[x - i, y + i, z]]: this.block(x - i, y + i, z),
        [[x - i, y + i, z - i]]: this.block(x - i, y + i, z - i),
        [[x - i, y + i, z + i]]: this.block(x - i, y + i, z + i),
        [[x + i, y + i, z]]: this.block(x + i, y + i, z),
        [[x + i, y + i, z - i]]: this.block(x + i, y + i, z - i),
        [[x + i, y + i, z + i]]: this.block(x + i, y + i, z + i),

        // Middle layer
        [[x, y, z - i]]: this.block(x, y, z - i),
        [[x, y, z + i]]: this.block(x, y, z + i),
        [[x - i, y, z]]: this.block(x - i, y, z),
        [[x - i, y, z - i]]: this.block(x - i, y, z - i),
        [[x - i, y, z + i]]: this.block(x - i, y, z + i),
        [[x + i, y, z]]: this.block(x + i, y, z),
        [[x + i, y, z - i]]: this.block(x + i, y, z - i),
        [[x + i, y, z + i]]: this.block(x + i, y, z + i)
      }
    }

    return neighbors
  }

  buildBuffer(
    gl,
    flags = {
      [CHUNK_FLAGS.BUILD_VERTICES]: true,
      [CHUNK_FLAGS.BUILD_COLORS]: true,
      [CHUNK_FLAGS.BUILD_TEXTURES]: true,
      [CHUNK_FLAGS.BUILD_LIGHTING]: true
    }
  ) {
    this.flags[CHUNK_FLAGS.DEBUG] = window.gameDebug

    let vertices = []
    let colors = []
    let textures = []
    let lighting = []
    let depths = []

    const position = this.worldPosition

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const block = this.blocks[x][y][z]
          if (block.transparent) continue
          // if (
          //   x !== 0 &&
          //   y !== 0 &&
          //   z !== 0 &&
          //   x !== CHUNK_SIZE - 1 &&
          //   y !== CHUNK_SIZE - 1 &&
          //   z !== CHUNK_SIZE - 1
          // ) {
          //   // Check if there's a neighbor above in this case
          //   const neighborAbove = this.block(x, y + 1, z)
          //   if (neighborAbove && neighborAbove.active) continue
          // }
          if (block.transparent) {
          } else if (block.active) {
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
            if (flags[CHUNK_FLAGS.BUILD_LIGHTING])
              lighting.push(...block.lighting)
            depths.push(...block.textureDepth)
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
    if (flags[CHUNK_FLAGS.BUILD_LIGHTING])
      updateBuffer(gl, this.lighting.solid, lighting)
    updateBuffer(gl, this.depths.solid, depths)

    if (flags[CHUNK_FLAGS.BUILD_VERTICES])
      this.bufferSizes.solid = vertices.length
  }

  render(gl, dt, program) {
    program.setAttrib(gl, 'a_position', this.vertices.solid, { size: 3 })
    program.setAttrib(gl, 'a_color', this.colors.solid, { size: 3 })
    if (!window.gameDebug) {
      program.setAttrib(gl, 'a_texcoord', this.textures.solid, { size: 2 })
      program.setAttrib(gl, 'a_lighting', this.lighting.solid, { size: 1 })
      program.setAttrib(gl, 'a_depth', this.depths.solid, { size: 1 })
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
        const height = Math.max(
          0,
          Math.floor(
            perlin(
              (x / CHUNK_SIZE + this.x) * CHUNK_SIZE,
              (z / CHUNK_SIZE + this.z) * CHUNK_SIZE,
              window.landPerm
            ) * CHUNK_SIZE
          )
        )
        assert(height >= 0, 'Height should be greater than 0')

        let y
        for (y = 0; y < height; y++) this.blocks[x][y][z].set(BLOCK_TYPES.DIRT)
        this.blocks[x][y][z].set(BLOCK_TYPES.DIRT_GRASS)
        if (height === CHUNK_SIZE / 4)
          this.blocks[x][y][z].set(BLOCK_TYPES.SAND)
        else if (height < CHUNK_SIZE / 4) water.push([x, y, z])
        this.heightmap[x][z] = height
      }
    }

    // for (let [x, y, z] of water) {
    //   for (let wy = CHUNK_SIZE / 4; wy >= y; wy--)
    //     this.blocks[x][wy][z].set(BLOCK_TYPES.WATER)
    // }

    for (let i = 0; i < CHUNK_SIZE; i++) {
      for (let j = 0; j < CHUNK_SIZE; j++) {}
    }

    this.terrain()
  }

  terrain() {
    let trees = []

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        let i = perlin(
          (x / CHUNK_SIZE + this.x) * CHUNK_SIZE,
          (z / CHUNK_SIZE + this.z) * CHUNK_SIZE,
          window.terrainPerm
        )
        const j = randomWithSeed(x * z + i * window.seed, true)
        const y = this.heightmap[x][z]
        if (j < 0.05 && y > CHUNK_SIZE / 3) {
          const neighbors = Object.values(this.neighbors(x, y, z, 4))
          if (neighbors.find(block => block?.type === BLOCK_TYPES.OAK.id))
            continue
          this.blocks[x][y + 1][z].set(BLOCK_TYPES.OAK)
          trees.push([x, y + 1, z])
        }
      }
    }

    for (let [x, y, z] of trees) {
      const neighbors = Object.values(this.neighbors(x, y, z, 9))
      if (neighbors.find(block => block?.type === BLOCK_TYPES.OAK.id)) {
        this.blocks[x][y][z].set(BLOCK_TYPES.AIR, false)
        continue
      }
      let i = Math.min(
        Math.ceil(
          perlin(
            (x / CHUNK_SIZE + this.x) * CHUNK_SIZE,
            (z / CHUNK_SIZE + this.z) * CHUNK_SIZE,
            window.terrainPerm
          ),
          0,
          1,
          2,
          6
        ),
        CHUNK_SIZE - this.heightmap[x][z]
      )
      for (let j = 0; j < i; j++) {
        try {
          this.blocks[x][y + j][z].set(BLOCK_TYPES.OAK)
        } catch {
          console.log(y + j)
        }
      }
      this.tree(x, i, z)
    }
  }

  tree(x, y, z) {
    try {
      this.blocks[x][y][z].set(BLOCK_TYPES.LEAF)
    } catch {
      console.log(x - 1)
    }
  }
}
