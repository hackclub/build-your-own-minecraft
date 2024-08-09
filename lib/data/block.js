import { repeatArray } from '../misc.js'

export const BLOCK_SIZE = 24
export const BLOCK_HIT_INTERVAL = BLOCK_SIZE / 2
export const MAX_LIGHT = 16
const ATLAS_SIZE = 256
const ATLAS_BLOCK_SIZE = 16
const ATLAS_ROW = ATLAS_SIZE / ATLAS_BLOCK_SIZE

export const BLOCK_TYPES = {
  GRASS: {
    id: 0,
    transparent: false
  },
  DIRT: {
    id: 2,
    transparent: false
  },
  DIRT_GRASS: {
    id: 3,
    transparent: false
  },
  PLANK: {
    id: 4,
    transparent: false
  },
  PEONY: {
    id: 12,
    transparent: true
  },
  SAND: {
    id: 18,
    transparent: false
  },
  AIR: {
    id: 27,
    transparent: true
  },
  OAK: {
    id: 20,
    transparent: false
  },
  INNER_LOG: {
    id: 21,
    transparent: false
  },
  BOOKCASE: {
    id: 35,
    transparent: false
  },
  DIAMOND: {
    id: 41,
    transparent: false
  },
  GRASS_SPROUT: {
    id: 93,
    transparent: true
  },
  WATER: {
    id: 205,
    transparent: false
  },
  LANTERN: {
    id: 212,
    light: MAX_LIGHT - 1,
    transparent: false
  }
}

export default class Block {
  constructor(active = false, type = BLOCK_TYPES.AIR) {
    this.active = active
    this.type = type.id
    this.transparent = type.transparent
    this.light = type.light ? type.light : 0
  }

  set(type, active = true) {
    this.active = active
    this.type = type.id
    this.transparent = type.transparent
    this.light = type.light || this.light
  }

  // x, y, z = 3 * 6 * 6 (6 vertices, 6 sides, 3 data points per vertex)
  // lighting = 6 * 6 (6 vertices, 6 sides, 1 lighting point per vertex)
  // rgb = 3 * 6 * 6 (6 vertices, 6 sides, 3 data points per vertex, -> can interpolate)
  // tx, ty = 2 * 6 * 6 (6 vertices, 6 sides, 2 texture coordinates per vertex)

  get colors() {
    const normalizeRgb = (r, g, b) => [r / 255, g / 255, b / 255]

    switch (this.type) {
      case BLOCK_TYPES.DIRT_GRASS.id:
        if (!window.gameDebug) return new Array(3 * 6 * 6).fill(1.0)
      case BLOCK_TYPES.GRASS.id:
        return repeatArray(normalizeRgb(124, 188, 84), 3 * 6 * 6)
      case BLOCK_TYPES.DIRT.id:
        if (window.gameDebug)
          return repeatArray(normalizeRgb(218, 165, 32), 3 * 6 * 6)
      case BLOCK_TYPES.WATER.id:
        if (window.gameDebug) return repeatArray([0.0, 0.0, 1.0], 3 * 6 * 6)
      case BLOCK_TYPES.LANTERN.id:
        if (window.gameDebug) return repeatArray([1.0, 1.0, 0.0], 3 * 6 * 6)
      default:
        if (window.gameDebug) return new Array(3 * 6 * 6).fill(0.0)
        return new Array(3 * 6 * 6).fill(1.0)
    }
  }

  get lighting() {
    // prettier-ignore
    return new Array(6 * 6).fill(this.light)
  }

  get normals() {
    // prettier-ignore
    return [
      ...repeatArray([0, 0, -1], 3 * 6), // Front
      ...repeatArray([0, 0, 1], 3 * 6), // Back
      ...repeatArray([0, 1, 0], 3 * 6), // Top
      ...repeatArray([0, -1, 0], 3 * 6), // Bottom
      ...repeatArray([-1, 0, 0], 3 * 6), // Left
      ...repeatArray([1, 0, 0], 3 * 6) // Right
    ]
  }

  get textures() {
    const mappedTexture = type => {
      // Quads are flipped
      return {
        endX: (type % ATLAS_ROW) * ATLAS_BLOCK_SIZE,
        endY: Math.floor(type / ATLAS_ROW) * ATLAS_BLOCK_SIZE,
        startX: (type % ATLAS_ROW) * ATLAS_BLOCK_SIZE + ATLAS_BLOCK_SIZE,
        startY:
          Math.floor(type / ATLAS_ROW) * ATLAS_BLOCK_SIZE + ATLAS_BLOCK_SIZE
      }
    }

    let quads = []
    switch (this.type) {
      case BLOCK_TYPES.DIRT_GRASS.id: {
        // Grass on top, dirt grass combo on sides
        const grassTexture = mappedTexture(BLOCK_TYPES.GRASS.id)
        const dirtGrassTexture = mappedTexture(BLOCK_TYPES.DIRT_GRASS.id)
        const dirtTexture = mappedTexture(BLOCK_TYPES.DIRT.id)
        quads = [
          dirtGrassTexture,
          dirtGrassTexture,
          grassTexture,
          dirtTexture,
          dirtGrassTexture,
          dirtGrassTexture
        ]
        break
      }
      case BLOCK_TYPES.OAK.id: {
        const outerLogTexture = mappedTexture(BLOCK_TYPES.OAK.id)
        const innerLogTexture = mappedTexture(BLOCK_TYPES.INNER_LOG.id)
        quads = [
          outerLogTexture,
          outerLogTexture,
          innerLogTexture,
          outerLogTexture,
          outerLogTexture,
          outerLogTexture
        ]
        break
      }
      case BLOCK_TYPES.GRASS_SPROUT.id: {
        const sproutTexture = mappedTexture(BLOCK_TYPES.GRASS_SPROUT.id)
        const airTexture = mappedTexture(BLOCK_TYPES.AIR.id)
        quads = [
          sproutTexture,
          sproutTexture,
          airTexture,
          sproutTexture,
          sproutTexture,
          sproutTexture
        ]
        break
      }
      default: {
        const texture = mappedTexture(this.type)
        quads = new Array(6).fill(texture)
      }
    }

    // prettier-ignore
    return [
      quads[0].startX, quads[0].startY,
      quads[0].startX, quads[0].endY,
      quads[0].endX, quads[0].startY,
      quads[0].startX, quads[0].endY,
      quads[0].endX, quads[0].endY,
      quads[0].endX, quads[0].startY,

      quads[1].startX, quads[1].startY,
      quads[1].endX, quads[1].startY,
      quads[1].startX, quads[1].endY,
      quads[1].startX, quads[1].endY,
      quads[1].endX, quads[1].startY,
      quads[1].endX, quads[1].endY,

      quads[2].startX, quads[2].startY,
      quads[2].startX, quads[2].endY,
      quads[2].endX, quads[2].startY,
      quads[2].startX, quads[2].endY,
      quads[2].endX, quads[2].endY,
      quads[2].endX, quads[2].startY,

      quads[3].startX, quads[3].startY,
      quads[3].endX, quads[3].startY,
      quads[3].startX, quads[3].endY,
      quads[3].startX, quads[3].endY,
      quads[3].endX, quads[3].startY,
      quads[3].endX, quads[3].endY,

      quads[4].endX, quads[4].startY,
      quads[4].startX, quads[4].startY,
      quads[4].endX, quads[4].endY,
      quads[4].startX, quads[4].startY,
      quads[4].startX, quads[4].endY,
      quads[4].endX, quads[4].endY,

      quads[5].startX, quads[5].startY,
      quads[5].startX, quads[5].endY,
      quads[5].endX, quads[5].startY,
      quads[5].endX, quads[5].startY,
      quads[5].startX, quads[5].endY,
      quads[5].endX, quads[5].endY
    ]
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
