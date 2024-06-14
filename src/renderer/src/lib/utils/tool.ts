export function urlStringify(
  data?: Record<string, string | number>,
  encode: boolean = true,
): string {
  if (!data) return ''
  return Object.entries(data)
    .map(([key, value]) => `${key}=${encode ? encodeURIComponent(value) : value}`)
    .join('&')
}
