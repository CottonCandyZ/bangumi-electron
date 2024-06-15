export function urlStringify(
  data?: Record<string, string | number>,
  encode: boolean = true,
): string {
  if (!data) return ''
  return Object.entries(data)
    .map(([key, value]) => `${key}=${encode ? encodeURIComponent(value) : value}`)
    .join('&')
}

export function createFormData(json: Record<string, string>) {
  const formData = new FormData()
  for (const key in json) {
    formData.append(key, json[key])
  }
  return formData
}
