/**
 * 由对象构建 FormData
 */
export function createFormData(json: Record<string, string>) {
  const formData = new FormData()
  for (const key in json) {
    formData.append(key, json[key])
  }
  return formData
}

/**
 * Clamps the given value between the specified minimum and maximum values
 * @param value The value to be clamped
 * @param min The minimum value, defaults to -Infinity if not provided
 * @param max The maximum value, defaults to Infinity if not provided
 * @returns The clamped value
 */
export function clamp(value: number, min: number = -Infinity, max: number = Infinity): number {
  return Math.min(Math.max(value, min), max)
}
