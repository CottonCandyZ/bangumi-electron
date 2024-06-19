import { queryClient } from '@renderer/components/wrapper'
import { LOGIN, webFetch } from '@renderer/constants/config'
import { client } from '@renderer/lib/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { token } from 'src/main/tipc'

// 这里是用来验证相关 session 的地方，如果可能也会刷新 Session

export async function isWebLogin() {
  const data = (await webFetch('/', {
    credentials: 'include',
    parseResponse: (text) => text,
  })) as string
  return !data.includes('<div class="guest">')
}

export async function isAccessTokenValid(token: token) {
  const json = (await webFetch(LOGIN.OAUTH_ACCESS_TOKEN_STATUS, {
    method: 'post',
    headers: {
      'Content-Type': LOGIN.POST_CONTENT_TYPE,
    },
    body: new URLSearchParams({
      access_token: token.access_token,
    }),
  })) as token & { user_id: string }
  return !!json.user_id
}

export async function logout() {
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_sid' })
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_sec_id' })
  await client.removeCookie({ url: 'https://bgm.tv', name: 'chii_cookietime' })
  await client.deleteAccessToken()
}
