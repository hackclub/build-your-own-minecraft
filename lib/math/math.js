export const degToRad = deg => (deg * Math.PI) / 180
export const radToDeg = rad => (rad * 180) / Math.PI
export const random = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min)
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
