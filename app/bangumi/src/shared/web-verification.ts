/** A permission error or stale form hash is not a Cloudflare challenge. */
export async function isCloudflareChallenge(response: { headers: Headers; _data?: unknown }) {
  if (response.headers.get('cf-mitigated') === 'challenge') return true
  if (!response.headers.get('content-type')?.includes('text/html')) return false
  const body =
    typeof response._data === 'string'
      ? response._data
      : response._data instanceof Blob
        ? await response._data.text()
        : ''
  // Cloudflare also injects passive JS detections into ordinary successful pages.
  return /window\._cf_chl_opt\s*=|\/cdn-cgi\/challenge-platform\/[^"'\s<>]*orchestrate\//.test(body)
}
