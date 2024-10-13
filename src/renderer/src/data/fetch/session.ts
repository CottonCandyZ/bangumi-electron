import { LOGIN, webFetch } from '@renderer/data/fetch/config'
import { Token } from '@renderer/data/types/login'
import { client } from '@renderer/lib/client'

// 这里是用来验证相关 session 的地方，如果可能也会刷新 Session

/**
 * 直接用访问主页，看看是不是 guest 来验证 web 登陆，实际上也可以用 /login redirect
 */
export async function isWebLogin() {
  const data = (await webFetch('/', {
    credentials: 'include',
    parseResponse: (text) => text,
  })) as string
  return !data.includes('<div class="guest">')
}

/**
 * 验证 AccessToken 有效性
 */
export async function isAccessTokenValid(token: Token) {
  const json = (await webFetch(LOGIN.OAUTH_ACCESS_TOKEN_STATUS, {
    method: 'post',
    headers: {
      'Content-Type': LOGIN.POST_CONTENT_TYPE,
    },
    body: new URLSearchParams({
      access_token: token.access_token,
    }),
  })) as Token & { user_id: string }
  return !!json.user_id
}

/**
 * 登出时清除相关内容
 */
export async function logout() {
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_sid' })
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_sec_id' })
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_cookietime' })
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_auth' })
  localStorage.removeItem('current_user_id')
}
