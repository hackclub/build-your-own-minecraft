import { BLOCK_SIZE } from '../data/block.js'
import { CHUNK_SIZE } from '../data/chunk.js'
import { INITIAL_CHUNKS_SIZE } from '../data/chunkManager.js'
import { degToRad } from '../math/math.js'
import { v3 } from '../math/v.js'

export const PLAYER_VELOCITY = 150
export const PLAYER_REACH = BLOCK_SIZE * 4

export default class Player {
  constructor() {
    this.x = (CHUNK_SIZE * BLOCK_SIZE * (INITIAL_CHUNKS_SIZE / 3)) / 2
    this.y = (CHUNK_SIZE * BLOCK_SIZE * (INITIAL_CHUNKS_SIZE / 3)) / 4
    this.z = (CHUNK_SIZE * BLOCK_SIZE * (INITIAL_CHUNKS_SIZE / 3)) / 2

    this.yaw = -90
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

  pointing(chunkManager) {
    for (let i = 0; i < PLAYER_REACH; i++) {
      const at = v3.add(this.position, v3.multiply(this.direction, i))
    }
  }
}
