import { shuffle } from './math.js'
import { v2 } from './v.js'

const makePermutation = () => {
  let perm = []
  for (let i = 0; i < 512; i++) perm.push(i)
  shuffle(perm)
  for (let i = 0; i < 512; i++) perm.push(perm[i])
  return perm
}

const perm = makePermutation()

const getConstantVector = v => {
  const h = v & 3
  switch (h) {
    case 0:
      return [1, 1]
    case 1:
      return [-1, 1]
    case 2:
      return [-1, -1]
    default:
      return [1, -1]
  }
}

export const smoothstep = t => ((6 * t - 15) * t + 10) * t * t * t

export const lerp = (t, a1, a2) => a1 + t * (a2 - a1)

export const noise = (x, y) => {
  const wrapX = Math.floor(x) & 255
  const wrapY = Math.floor(y) & 255

  const xf = x - Math.floor(x)
  const yf = y - Math.floor(y)

  const topRight = [xf - 1, yf - 1]
  const topLeft = [xf, yf - 1]
  const bottomRight = [xf - 1, yf]
  const bottomLeft = [xf, yf]

  const valueTopRight = perm[perm[wrapX + 1] + wrapY + 1]
  const valueTopLeft = perm[perm[wrapX] + wrapY + 1]
  const valueBottomRight = perm[perm[wrapX + 1] + wrapY]
  const valueBottomLeft = perm[perm[wrapX] + wrapY]

  const dotTopRight = v2.dot(topRight, getConstantVector(valueTopRight))
  const dotTopLeft = v2.dot(topLeft, getConstantVector(valueTopLeft))
  const dotBottomRight = v2.dot(
    bottomRight,
    getConstantVector(valueBottomRight)
  )
  const dotBottomLeft = v2.dot(bottomLeft, getConstantVector(valueBottomLeft))

  const u = smoothstep(xf)
  const v = smoothstep(yf)

  return lerp(
    u,
    lerp(v, dotBottomLeft, dotTopLeft),
    lerp(v, dotBottomRight, dotTopRight)
  )
}

const perlin = (x, y) => {
  let n = 0
  let resolution = 1
  let frequency = 0.005

  for (let octave = 0; octave < 8; octave++) {
    n += resolution * noise(x * frequency, y * frequency)
    resolution *= 0.5
    frequency *= 2
  }

  return (n + 1) / 2
}

export default perlin
