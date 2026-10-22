import { HOST } from '@renderer/data/fetch/config/'

/**
 * 把应用内路由映射成 Bangumi 网页版对应的地址，没有对应页面时返回 null。
 * `profileUsername` 用于把 /profile 映射到当前用户的主页。
 */
export function getSiteUrl(pathname: string, profileUsername?: string) {
  const episode = pathname.match(/^\/episode\/(\d+)/)
  if (episode) return `${HOST}/ep/${episode[1]}`

  const direct = pathname.match(
    /^\/((?:subject|person|character|index)\/\d+|(?:group|subject)\/topic\/\d+|blog\/\d+|user\/[^/?#]+)/,
  )
  if (direct) return `${HOST}/${direct[1]}`

  if (pathname === '/profile' && profileUsername) return `${HOST}/user/${profileUsername}`

  return null
}

/** 在系统浏览器中打开（主进程会把新窗口请求转给 shell.openExternal） */
export function openInBrowser(url: string) {
  window.open(url, '_blank', 'noreferrer')
}
