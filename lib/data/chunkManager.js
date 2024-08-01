import { repeatArray } from '../misc.js'
import { BLOCK_SIZE } from './block.js'
import Chunk, { CHUNK_SIZE } from './chunk.js'
import m4 from '../math/m4.js'

export const INITIAL_CHUNKS_SIZE = 9
export const MAX_CHUNKS_LOAD = 3

export default class ChunkManager {
  constructor(gl) {
    this.chunks = []
    this.loadChunks = []
    this.rebuildChunks = []
    this.renderChunks = [] // The first time, we're going to only render the top layer of chunks'

    for (let x = 0; x < INITIAL_CHUNKS_SIZE / 3; x++) {
      for (let y = 0; y < INITIAL_CHUNKS_SIZE / 3; y++) {
        for (let z = 0; z < INITIAL_CHUNKS_SIZE / 3; z++) {
          const chunk = new Chunk(gl, x, y, z)
          this.chunks.push(chunk)
          if (y == 0) {
            chunk.noise()
            chunk.buildBuffer(gl)
            this.renderChunks.push(this.chunks.length - 1)
          } else this.loadChunks.push(this.chunks.length - 1)
        }
      }
    }

    this.flags = {
      TOGGLE_DEBUG: false
    }
  }

  chunkAtCoord(x, y, z, list) {
    return (list || this.chunks).find(chunk => {
      return chunk.x == x && chunk.y == y && chunk.z == z
    })
  }

  idxToCoord(idx) {}

  updateLoadList(gl, dt, pos, pov) {
    // Check if we need to add any chunks to player's view when they've moved
    const [x, y, z] = pos
    const xPos = Math.round(x / (CHUNK_SIZE * BLOCK_SIZE))
    const yPos = -Math.round(y / (CHUNK_SIZE * BLOCK_SIZE))
    const zPos = Math.round(z / (CHUNK_SIZE * BLOCK_SIZE))

    const chunk = this.chunkAtCoord(xPos, 0, zPos)
    if (!chunk) {
      // Chunk doesn't exist but is in player's view, let's add it to rendering list'
      const chunk = new Chunk(gl, xPos, 0, zPos)
      console.log(pos, [xPos, yPos, zPos], [chunk.x, chunk.y, chunk.z])
      this.chunks.push(chunk)
      this.renderChunks.push(this.chunks.length - 1)
      chunk.noise()
      chunk.buildBuffer(gl)
    }
  }

  updateRenderList(gl, dt, pos, pov) {}

  update(gl, dt, pos, pov) {
    this.updateLoadList(gl, dt, pos, pov)

    for (let idx of this.rebuildChunks) {
      // Rebuild chunks that were changed in the last frame
      const chunk = this.chunks[idx]
      chunk.buildBuffer(gl)
    }

    this.updateRenderList(gl, dt, pos, pov)
  }
}
