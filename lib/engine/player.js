import { BLOCK_HIT_INTERVAL, BLOCK_SIZE, BLOCK_TYPES } from '../data/block.js'
import { CHUNK_SIZE } from '../data/chunk.js'
import { INITIAL_CHUNKS_SIZE } from '../data/chunkManager.js'
import { degToRad } from '../math/math.js'
import { v3 } from '../math/v.js'
import { repeatArray } from '../misc.js'
import { drawImage } from './utils.js'

export const PLAYER_VELOCITY = BLOCK_SIZE * 5
export const PLAYER_REACH = BLOCK_SIZE * 5
export const PLAYER_HEIGHT = BLOCK_SIZE * 1.15

// Constants for rendering UI: inventory, inventory selector
const GUI_SIZE = [256, 64]
const INVENTORY = {
  sx: 0,
  sy: 0,
  sw: 182,
  sh: 22,
  spi: 2, // Padding repr. the black pixels around inventory
  dpb: 10, // Destination padding bottom
  max: 9 // Holds nine items
}
const INVENTORY_SELECTOR = {
  sx: 0,
  sy: 22,
  sw: 24,
  sh: 24
}
const EXPAND = [2.25, 2.25]

export default class Player {
  constructor() {
    this.x = (CHUNK_SIZE * BLOCK_SIZE * (INITIAL_CHUNKS_SIZE / 3)) / 2
    this.y = Math.round(
      (CHUNK_SIZE * BLOCK_SIZE * (INITIAL_CHUNKS_SIZE / 3)) / 2
    )
    this.z = (CHUNK_SIZE * BLOCK_SIZE * (INITIAL_CHUNKS_SIZE / 3)) / 2

    this.height = PLAYER_HEIGHT
    this.flying = false
    this.velocity = PLAYER_VELOCITY
    this.yaw = -90
    this.pitch = 0

    this.touching = undefined
    this.selection = 0
    this.inventory = [
      {
        type: BLOCK_TYPES.PLANK,
        quantity: Infinity
      }
    ]
  }

  get worldPosition() {
    return [this.x, this.y, this.z]
  }

  get voxelPosition() {
    return [
      this.x / (CHUNK_SIZE * BLOCK_SIZE),
      this.y / (CHUNK_SIZE * BLOCK_SIZE),
      this.z / (CHUNK_SIZE * BLOCK_SIZE)
    ]
  }

  get direction() {
    return v3.normalize([
      Math.cos(degToRad(this.yaw)) * Math.cos(degToRad(this.pitch)),
      Math.sin(degToRad(this.pitch)),
      Math.sin(degToRad(this.yaw)) * Math.cos(degToRad(this.pitch))
    ])
  }

  get pov() {
    return v3.add(this.worldPosition, [0, this.height, 0])
  }

  translate(tx, ty, tz) {
    this.x -= tx
    this.y -= ty
    this.z -= tz
  }

  pointing(chunkManager) {
    for (let i = 0; i < PLAYER_REACH; i += BLOCK_HIT_INTERVAL) {
      const at = v3.add(this.pov, v3.multiply(this.direction, i))
      const voxel = chunkManager.worldToVoxel(...at)
      if (voxel?.block && voxel.block.active) {
        this.touching = voxel
        return voxel
      }
    }
    this.touching = undefined
  }

  renderInventory(gl, programs, textures) {
    if (this.touching) {
      // Indicate selected block
      const { chunk, block, position } = this.touching
      const vertices = block.vertices(
        chunk.worldPosition[0] + position[0] * BLOCK_SIZE,
        chunk.worldPosition[1] + position[1] * BLOCK_SIZE,
        chunk.worldPosition[2] + position[2] * BLOCK_SIZE
      )
      const colors = repeatArray([1.0, 1.0, 1.0, 0.1], 4 * 6 * 6)
      programs.shape.use(gl)
      programs.shape.setBuffer(gl, 'a_position', vertices, { size: 3 })
      programs.shape.setBuffer(gl, 'a_color', colors, { size: 4 })
      programs.shape.enableAttrib(gl, 'a_position')
      programs.shape.enableAttrib(gl, 'a_color')
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3)
    }

    drawImage(
      gl,
      programs.img,
      textures.gui,
      INVENTORY.sx,
      INVENTORY.sy,
      INVENTORY.sw,
      INVENTORY.sh,
      gl.canvas.width / 2 - (INVENTORY.sw * EXPAND[0]) / 2,
      gl.canvas.height - (INVENTORY.sh * EXPAND[1] + INVENTORY.dpb),
      INVENTORY.sw * EXPAND[0],
      INVENTORY.sh * EXPAND[1],
      ...GUI_SIZE
    )

    drawImage(
      gl,
      programs.img,
      textures.gui,
      INVENTORY_SELECTOR.sx,
      INVENTORY_SELECTOR.sy,
      INVENTORY_SELECTOR.sw,
      INVENTORY_SELECTOR.sh,
      gl.canvas.width / 2 -
        (INVENTORY.sw * EXPAND[0]) / 2 +
        this.selection * ((INVENTORY.sw * EXPAND[0]) / INVENTORY.max) -
        INVENTORY.spi * EXPAND[0],
      gl.canvas.height -
        (INVENTORY_SELECTOR.sh * EXPAND[1] + INVENTORY.dpb - INVENTORY.spi),
      INVENTORY_SELECTOR.sw * EXPAND[0],
      INVENTORY_SELECTOR.sh * EXPAND[1],
      ...GUI_SIZE
    )
  }
}
