import { repeatArray, assert } from '../misc.js'

export const BLOCK_SIZE = 16
const ATLAS_SIZE = 256
const ATLAS_BLOCK_SIZE = 16
const ATLAS_ROW = ATLAS_SIZE / ATLAS_BLOCK_SIZE

export const BLOCK_TYPES = {
  GRASS: 0,
  DIRT: 2,
  DIRT_GRASS: 3,
  PLANK: 4,
  BOOK: 35,
  DIAMOND: 41,
  WATER: 205
}

export default class Block {
  constructor(active = true, type = BLOCK_TYPES.DIRT) {
    this.active = active
    this.type = type
  }

  // x, y, z = 3 * 6 * 6 (6 vertices, 6 sides, 3 data points per vertex)
  // rgb = 3 * 6 * 6 (6 vertices, 6 sides, 3 data points per vertex, -> can interpolate)
  // tx, ty = 2 * 6 * 6 (6 vertices, 6 sides, 2 texture coordinates per vertex)

  get colors() {
    const normalizeRgb = (r, g, b) => {
      return [r / 255, g / 255, b / 255]
    }

    switch (this.type) {
      case BLOCK_TYPES.DIRT_GRASS:
        if (!window.gameDebug)
          return [
            ...repeatArray([1.0, 1.0, 1.0], 3 * 6 * 2),
            ...repeatArray(normalizeRgb(137, 195, 101), 3 * 6),
            ...repeatArray([1.0, 1.0, 1.0], 3 * 6 * 3)
          ]
      case BLOCK_TYPES.GRASS:
        return repeatArray(normalizeRgb(124, 188, 84), 3 * 6 * 6)
      case BLOCK_TYPES.DIRT:
        if (window.gameDebug)
          return repeatArray([218 / 255, 165 / 255, 32 / 255], 3 * 6 * 6)
      case BLOCK_TYPES.WATER:
        if (window.gameDebug) return repeatArray([0.0, 0.0, 1.0], 3 * 6 * 6)
      default:
        return new Array(3 * 6 * 6).fill(1.0)
    }
  }

  get normals() {
    // prettier-ignore
    const normals = [
      ...repeatArray([0, 0, -1], 3 * 6),  // Front
      ...repeatArray([0, 0, 1], 3 * 6),  // Back
      ...repeatArray([0, 1, 0], 3 * 6),  // Top
      ...repeatArray([0, -1, 0], 3 * 6), // Bottom
      ...repeatArray([-1, 0, 0], 3 * 6), // Left
      ...repeatArray([1, 0, 0], 3 * 6) // Right
    ]
    return normals
  }

  get textures() {
    const offset = (val, offset = 0.5) => (val + 0) / ATLAS_SIZE
    const mappedTexture = type => {
      return {
        endX: offset((type % ATLAS_ROW) * ATLAS_BLOCK_SIZE),
        endY: offset(Math.floor(type / ATLAS_ROW) * ATLAS_BLOCK_SIZE),
        startX: offset(
          (type % ATLAS_ROW) * ATLAS_BLOCK_SIZE + ATLAS_BLOCK_SIZE,
          -0.5
        ),
        startY: offset(
          Math.floor(type / ATLAS_ROW) * ATLAS_BLOCK_SIZE + ATLAS_BLOCK_SIZE,
          -0.5
        )
      }
    }

    switch (this.type) {
      case BLOCK_TYPES.DIRT_GRASS: {
        // Grass on top, dirt grass combo on sides
        const grassTexture = mappedTexture(BLOCK_TYPES.GRASS)
        const dirtGrassTexture = mappedTexture(BLOCK_TYPES.DIRT_GRASS)

        // prettier-ignore
        return [
          dirtGrassTexture.startX, dirtGrassTexture.startY,
          dirtGrassTexture.startX, dirtGrassTexture.endY,
          dirtGrassTexture.endX, dirtGrassTexture.startY,
          dirtGrassTexture.startX, dirtGrassTexture.endY,
          dirtGrassTexture.endX, dirtGrassTexture.endY,
          dirtGrassTexture.endX, dirtGrassTexture.startY,

          dirtGrassTexture.startX, dirtGrassTexture.startY,
          dirtGrassTexture.endX, dirtGrassTexture.startY,
          dirtGrassTexture.startX, dirtGrassTexture.endY,
          dirtGrassTexture.startX, dirtGrassTexture.endY,
          dirtGrassTexture.endX, dirtGrassTexture.startY,
          dirtGrassTexture.endX, dirtGrassTexture.endY,

          grassTexture.startX, grassTexture.startY,
          grassTexture.startX, grassTexture.endY,
          grassTexture.endX, grassTexture.startY,
          grassTexture.startX, grassTexture.endY,
          grassTexture.endX, grassTexture.endY,
          grassTexture.endX, grassTexture.startY,

          dirtGrassTexture.startX, dirtGrassTexture.startY,
          dirtGrassTexture.endX, dirtGrassTexture.startY,
          dirtGrassTexture.startX, dirtGrassTexture.endY,
          dirtGrassTexture.startX, dirtGrassTexture.endY,
          dirtGrassTexture.endX, dirtGrassTexture.startY,
          dirtGrassTexture.endX, dirtGrassTexture.endY,

          dirtGrassTexture.endX, dirtGrassTexture.startY,
          dirtGrassTexture.startX, dirtGrassTexture.startY,
          dirtGrassTexture.endX, dirtGrassTexture.endY,
          dirtGrassTexture.startX, dirtGrassTexture.startY,
          dirtGrassTexture.startX, dirtGrassTexture.endY,
          dirtGrassTexture.endX, dirtGrassTexture.endY,

          dirtGrassTexture.startX, dirtGrassTexture.startY,
          dirtGrassTexture.startX, dirtGrassTexture.endY,
          dirtGrassTexture.endX, dirtGrassTexture.startY,
          dirtGrassTexture.endX, dirtGrassTexture.startY,
          dirtGrassTexture.startX, dirtGrassTexture.endY,
          dirtGrassTexture.endX, dirtGrassTexture.endY
        ]
      }
      default: {
        let startX = offset((this.type % ATLAS_ROW) * ATLAS_BLOCK_SIZE)
        let startY = offset(
          Math.floor(this.type / ATLAS_ROW) * ATLAS_BLOCK_SIZE
        )
        let endX = offset(
          (this.type % ATLAS_ROW) * ATLAS_BLOCK_SIZE + ATLAS_BLOCK_SIZE,
          -0.5
        )
        let endY = offset(
          Math.floor(this.type / ATLAS_ROW) * ATLAS_BLOCK_SIZE +
            ATLAS_BLOCK_SIZE,
          -0.5
        )

        // prettier-ignore
        let texture = [
          startX, startY,
          startX, endY,
          endX, startY,
          startX, endY,
          endX, endY,
          endX, startY,

          startX, startY,
          endX, startY,
          startX, endY,
          startX, endY,
          endX, startY,
          endX, endY,

          startX, startY,
          startX, endY,
          endX, startY,
          startX, endY,
          endX, endY,
          endX, startY,

          startX, startY,
          endX, startY,
          startX, endY,
          startX, endY,
          endX, startY,
          endX, endY,

          // Front face
          // startX, startY,
          // startX, endY,
          // endX, startY,
          // startX, endY,
          // endX, endY,
          // endX, startY,

          startX, startY,
          startX, endY,
          endX, startY,
          startX, endY,
          endX, endY,
          endX, startY,

          startX, startY,
          endX, startY,
          startX, endY,
          startX, endY,
          endX, startY,
          endX, endY
        ]
        return texture
      }
    }
  }

  vertices(x, y, z) {
    // prettier-ignore
    return [
      x, y, z, x, y + BLOCK_SIZE, z, x + BLOCK_SIZE, y, z, x, y + BLOCK_SIZE, z, x + BLOCK_SIZE, y + BLOCK_SIZE, z, x + BLOCK_SIZE, y, z,  // Front
      x, y, z + BLOCK_SIZE, x + BLOCK_SIZE, y, z + BLOCK_SIZE, x, y + BLOCK_SIZE, z + BLOCK_SIZE, x, y + BLOCK_SIZE, z + BLOCK_SIZE, x + BLOCK_SIZE, y, z + BLOCK_SIZE, x + BLOCK_SIZE, y + BLOCK_SIZE, z + BLOCK_SIZE,  // Back
      x, y + BLOCK_SIZE, z, x, y + BLOCK_SIZE, z + BLOCK_SIZE, x + BLOCK_SIZE, y + BLOCK_SIZE, z, x, y + BLOCK_SIZE, z + BLOCK_SIZE, x + BLOCK_SIZE, y + BLOCK_SIZE, z + BLOCK_SIZE, x + BLOCK_SIZE, y + BLOCK_SIZE, z,  // Top
      x, y, z, x + BLOCK_SIZE, y, z, x, y, z + BLOCK_SIZE, x, y, z + BLOCK_SIZE, x + BLOCK_SIZE, y, z, x + BLOCK_SIZE, y, z + BLOCK_SIZE,  // Bottom
      x, y, z, x, y, z + BLOCK_SIZE, x, y + BLOCK_SIZE, z, x, y, z + BLOCK_SIZE, x, y + BLOCK_SIZE, z + BLOCK_SIZE, x, y + BLOCK_SIZE, z,  // Left
      x + BLOCK_SIZE, y, z, x + BLOCK_SIZE, y + BLOCK_SIZE, z, x + BLOCK_SIZE, y, z + BLOCK_SIZE, x + BLOCK_SIZE, y, z + BLOCK_SIZE, x + BLOCK_SIZE, y + BLOCK_SIZE, z, x + BLOCK_SIZE, y + BLOCK_SIZE, z + BLOCK_SIZE  // Right
    ]
  }
}
