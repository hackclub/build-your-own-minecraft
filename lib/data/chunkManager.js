import { BLOCK_SIZE } from './block.js'
import Chunk, { CHUNK_SIZE } from './chunk.js'

export const INITIAL_CHUNKS_SIZE = 9
export const MAX_CHUNKS_LOAD = 3

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
        const chunk = new Chunk(gl, x, 0, z)
        chunk.noise()
        chunk.buildBuffer(gl)
        // Update sunlight values
        this.chunks[chunk.voxelPosition] = chunk
        this.renderChunks.add(chunk.voxelPosition.toString())
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
    const bufferX = Math.floor(
      (x / (CHUNK_SIZE * BLOCK_SIZE) - chunkX) * CHUNK_SIZE
    )
    const bufferY = Math.floor(
      (y / (CHUNK_SIZE * BLOCK_SIZE) - chunkY) * CHUNK_SIZE
    )
    const bufferZ = Math.floor(
      (z / (CHUNK_SIZE * BLOCK_SIZE) - chunkZ) * CHUNK_SIZE
    )
    return {
      chunk,
      block: chunk.block(bufferX, bufferY, bufferZ),
      position: [bufferX, bufferY, bufferZ]
    }
  }

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

  generateLoadList(gl, pos, radius = MAX_CHUNKS_LOAD) {}

  updateLoadList(gl, dt, [x, y, z], pov) {
    const parentChunk = [
      Math.floor(x / (CHUNK_SIZE * BLOCK_SIZE)),
      Math.floor(y / (CHUNK_SIZE * BLOCK_SIZE)),
      Math.floor(z / (CHUNK_SIZE * BLOCK_SIZE))
    ]
  }

  updateRenderList(gl, dt, pos, pov) {}

  update(gl, dt, pos, pov) {
    this.updateLight()
    this.updateLoadList(gl, dt, pos, pov)

    for (let coord of this.rebuildChunks) {
      const chunk = this.chunks[coord]
      chunk.buildBuffer(gl)
      this.renderChunks.add(coord)
    }
    this.rebuildChunks.clear()

    this.updateRenderList(gl, dt, pos, pov)
  }
}
