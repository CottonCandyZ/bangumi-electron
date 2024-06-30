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
