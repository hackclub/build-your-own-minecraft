import { BLOCK_SIZE } from '../data/block.js'
import { CHUNK_SIZE } from '../data/chunk.js'
import { INITIAL_CHUNKS_SIZE } from '../data/chunkManager.js'
import { degToRad } from '../math/math.js'
import { v3 } from '../math/v.js'

export const PLAYER_VELOCITY = 150

export default class Player {
  constructor() {
    this.x = (CHUNK_SIZE * BLOCK_SIZE * (INITIAL_CHUNKS_SIZE / 3)) / 2
    this.y = (CHUNK_SIZE * BLOCK_SIZE * (INITIAL_CHUNKS_SIZE / 3)) / 4
    this.z = (CHUNK_SIZE * BLOCK_SIZE * (INITIAL_CHUNKS_SIZE / 3)) / 2

    this.yaw = -90 // Initialized to -90 since a yaw of 0.0 results in a direction vector pointing to the right so we initially rotate a bit to the left
    this.pitch = 0
  }

  get position() {
    return [this.x, this.y, this.z]
  }

  get direction() {
    return v3.normalize([
      Math.cos(degToRad(this.yaw)) * Math.cos(degToRad(this.pitch)),
      Math.sin(degToRad(this.pitch)),
      Math.sin(degToRad(this.yaw)) * Math.cos(degToRad(this.pitch))
    ])
  }

  translate(tx, ty, tz) {
    this.x -= tx
    this.y -= ty
    this.z -= tz
  }
}
