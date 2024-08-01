export const repeatArray = (arr, size) => {
  let res = []
  while (res.length < size) res.push(...arr)
  return res
}

export const assert = (condition, unexpected) => {
  if (!condition) throw new Error(unexpected)
}
