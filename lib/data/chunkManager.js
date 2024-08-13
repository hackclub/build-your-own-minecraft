import { BLOCK_SIZE, BLOCK_TYPES } from './block.js'
import Chunk, { CHUNK_SIZE } from './chunk.js'
import { v3 } from '../math/v.js'

export const INITIAL_CHUNKS_SIZE = 18
export const MAX_CHUNKS_LOAD = 3

export class Voxel {
  constructor(chunk, position) {
    this.chunk = chunk
    this.block = this.chunk.block(...position)
    this.position = position
  }
}

export const worldToVoxel = ([x, y, z]) => [
  x / (CHUNK_SIZE * BLOCK_SIZE),
  y / (CHUNK_SIZE * BLOCK_SIZE),
  z / (CHUNK_SIZE * BLOCK_SIZE)
]

export const worldToChunk = pos => worldToVoxel(pos).map(i => Math.floor(i))

export default class ChunkManager {
  constructor(gl) {
    this.chunks = {}
    this.loadChunks = new Set()
    this.rebuildChunks = new Set()
    this.renderChunks = new Set() // The first time, we're going to only render the top layer of chunks

    this.lightQueue = []
    this.sunlightQueue = []

    for (let x = 0; x < INITIAL_CHUNKS_SIZE / 3; x++) {
      for (let z = 0; z < INITIAL_CHUNKS_SIZE / 3; z++) {
        console.log(x, z)
        const chunk = this.addChunk(gl, x, 0, z)
        this.renderChunks.add(chunk.voxelPositionHash)
      }
    }

    this.flags = {
      TOGGLE_DEBUG: false
    }
  }

  chunk(x, y, z) {
    return this.chunks[[x, y, z]]
  }

  worldToVoxel(x, y, z) {
    const chunkX = Math.floor(x / (CHUNK_SIZE * BLOCK_SIZE))
    const chunkY = Math.floor(y / (CHUNK_SIZE * BLOCK_SIZE))
    const chunkZ = Math.floor(z / (CHUNK_SIZE * BLOCK_SIZE))
    const chunk = this.chunk(chunkX, chunkY, chunkZ)
    if (!chunk) return
    return new Voxel(chunk, [
      Math.floor((x / (CHUNK_SIZE * BLOCK_SIZE) - chunkX) * CHUNK_SIZE),
      Math.floor((y / (CHUNK_SIZE * BLOCK_SIZE) - chunkY) * CHUNK_SIZE),
      Math.floor((z / (CHUNK_SIZE * BLOCK_SIZE) - chunkZ) * CHUNK_SIZE)
    ])
  }

  addChunk(gl, x, y, z) {
    const chunk = new Chunk(
      gl,
      x,
      y,
      z,
      y !== 0 ? [true, BLOCK_TYPES.DIRT] : undefined
    )
    if (y === 0) chunk.noise()
    chunk.buildBuffer(gl)
    this.chunks[chunk.voxelPosition] = chunk
    return chunk
  }

  addBlock(gl, x, y, z, type) {}

  removeBlock(gl, x, y, z) {}

  // Managing chunks
  updateLight() {
    while (this.lightQueue.length) {
      const { chunk, position } = this.lightQueue[0]
      const block = chunk.block(...position)
      const neighbors = chunk.neighbors(...position)
      // Check edges
      for (let [coords, neighbor] of Object.entries(neighbors)) {
        // TODO: Have to also check neighbors that are on bordering chunks
        if (neighbor && neighbor.light <= block.light - 2) {
          neighbor.light = block.light - 1
          this.lightQueue.push({
            chunk,
            position: coords.split(',').map(coord => Number(coord))
          })
          this.rebuildChunks.add(chunk.voxelPosition.toString())
        }
      }
      this.lightQueue.shift()
    }
  }

  updateLoadList(gl, pos, pov) {
    let xChunks = []
    let zChunks = []
    const [x, y, z] = worldToChunk(pos)

    for (let i = x - 3; i < x + 3; i++) {
      for (let j = z - 3; j < z + 3; j++) {
        if (!this.chunk(i, 0, j)) {
          const chunk = this.addChunk(gl, i, 0, j)
          this.renderChunks.add(chunk.voxelPositionHash)
        }
      }
    }
  }

  updateRenderList(gl, pos, pov) {
    const playerPos = worldToChunk(pos)
    this.renderChunks = new Set(
      [...this.renderChunks].filter(chunk => {
        if (v3.distance(playerPos, chunk) > 4) {
          console.log(true)
          return false
        }
        return true
      })
    )
  }

  update(gl, dt, pos, pov) {}
}
