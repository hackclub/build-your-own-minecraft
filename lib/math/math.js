export const degToRad = deg => (deg * Math.PI) / 180
export const radToDeg = rad => (rad * 180) / Math.PI
export const random = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min)
export const randomWithSeed = (seed, call = false) => {
  const rand = () => {
    seed |= 0
    seed = (seed + 0x9e3779b9) | 0
    let t = seed ^ (seed >>> 16)
    t = Math.imul(t, 0x21f0aaad)
    t = t ^ (t >>> 15)
    t = Math.imul(t, 0x735a2d97)
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296
  }
  if (!call) return rand
  return rand()
}
export const shuffle = arr => {
  let idx = arr.length
  while (idx !== 0) {
    const randomIdx = Math.floor(Math.random() * idx)
    idx--
    ;[arr[idx], arr[randomIdx]] = [arr[randomIdx], arr[idx]]
  }
}
export const map = (val, oldMin, oldMax, newMin, newMax) => {
  // Map from old range -> new range
  return ((val - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin
}
