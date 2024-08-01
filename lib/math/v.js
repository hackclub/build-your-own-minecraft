export class v2 {
  static dot(a, b) {
    return a[0] * b[0] + a[1] * b[1]
  }
}

export class v3 {
  static normalize(v) {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    if (length > 0.00001) return [v[0] / length, v[1] / length, v[2] / length]
    return [0, 0, 0]
  }

  static add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
  }

  static subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  }

  static multiply(a, factor) {
    return [a[0] * factor, a[1] * factor, a[2] * factor]
  }

  static cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ]
  }

  static dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  }

  static translate(v, x, y, z) {
    return [v[0] + x, v[1] + y, v[2] + z]
  }
}
