export type BangumiSectionPath = 'anime' | 'book' | 'music' | 'game' | 'real'
export type VerifiedPages = Partial<Record<BangumiSectionPath, string>>
export type WebVerificationInput = {
  sectionPath?: BangumiSectionPath
  subjectId?: number
  url?: string
}

/** Open a read page, never a GET action such as removing a collection or reply. */
export function getWebVerificationUrl(request: string) {
  const url = new URL(request, 'https://bgm.tv')
  if (url.origin !== 'https://bgm.tv' || url.username || url.password)
    throw new Error('无效的 Bangumi 网页验证地址')
  if (url.pathname === '/oauth/authorize') {
    url.hash = ''
    return url.toString()
  }
  const path = url.pathname.match(
    /^\/(?:subject\/topic\/\d+|group\/topic\/\d+|(?:subject|ep|person|character|blog|index)\/\d+)(?=\/|$)/,
  )?.[0]
  if (path) return `https://bgm.tv${path}`
  if (/^\/(?:login|FollowTheRabbit|signup\/captcha)\/?$/.test(url.pathname))
    return 'https://bgm.tv/login'
  const category = url.pathname.match(/^\/(anime|book|music|game|real)(?:\/|$)/)?.[1]
  return category ? `https://bgm.tv/${category}/browser/?sort=trends` : 'https://bgm.tv/'
}

/** A permission error or stale form hash is not a Cloudflare challenge. */
export async function isCloudflareChallenge(response: { headers: Headers; _data?: unknown }) {
  if (response.headers.get('cf-mitigated') === 'challenge') return true
  if (!response.headers.get('content-type')?.toLowerCase().includes('text/html')) return false
  const body =
    typeof response._data === 'string'
      ? response._data
      : response._data instanceof Blob
        ? await response._data.text()
        : ''
  // Cloudflare also injects passive JS detections into ordinary successful pages.
  return /window\._cf_chl_opt\s*=|\/cdn-cgi\/challenge-platform\/[^"'\s<>]*orchestrate\//.test(body)
}
