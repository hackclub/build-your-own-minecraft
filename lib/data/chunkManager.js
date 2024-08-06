import { BLOCK_SIZE } from './block.js'
import Chunk, { CHUNK_SIZE } from './chunk.js'

export const INITIAL_CHUNKS_SIZE = 9
export const MAX_CHUNKS_LOAD = 3

export default class ChunkManager {
  constructor(gl) {
    this.chunks = {}
    this.loadChunks = []
    this.rebuildChunks = []
    this.renderChunks = [] // The first time, we're going to only render the top layer of chunks

    for (let x = 0; x < INITIAL_CHUNKS_SIZE / 3; x++) {
      for (let z = 0; z < INITIAL_CHUNKS_SIZE / 3; z++) {
        const chunk = new Chunk(gl, x, 0, z)
        chunk.noise()
        chunk.buildBuffer(gl)
        this.chunks[chunk.chunkPosition] = chunk
        this.renderChunks.push(chunk.chunkPosition)
      }
    }

    this.flags = {
      TOGGLE_DEBUG: false
    }
  }

  chunk(x, y, z) {
    return this.chunks[[x, y, z]]
  }

  updateLoadList(gl, dt, pos, pov) {
    const [x, y, z] = pos
    const xPos = Math.round(x / (CHUNK_SIZE * BLOCK_SIZE))
    const yPos = -Math.round(y / (CHUNK_SIZE * BLOCK_SIZE))
    const zPos = Math.round(z / (CHUNK_SIZE * BLOCK_SIZE))

    const chunk = this.chunk(xPos, 0, zPos)
    if (!chunk) {
      // Chunk doesn't exist but is in player's view, let's add it to rendering list
      const chunk = new Chunk(gl, xPos, 0, zPos)
      chunk.noise()
      chunk.buildBuffer(gl)
      this.chunks[chunk.chunkPosition] = chunk
      this.renderChunks.push(chunk.chunkPosition)
    }
  }

  updateRenderList(gl, dt, pos, pov) {}

  update(gl, dt, pos, pov) {
    this.updateLoadList(gl, dt, pos, pov)

    for (let coord of this.rebuildChunks) {
      const chunk = this.chunks[coord]
      chunk.buildBuffer(gl)
    }

    this.updateRenderList(gl, dt, pos, pov)
  }
}
