import {
  APP_ID,
  APP_SECRET,
  LOGIN,
  URL_OAUTH_REDIRECT,
  webFetch,
} from '@renderer/data/fetch/config'
import { client } from '@renderer/lib/client'
import { getTimestamp } from '@renderer/lib/utils/date'
import { LoginError } from '@renderer/lib/utils/error'
import { domParser } from '@renderer/lib/utils/parser'
import { Token } from 'src/main/tipc'

// 所以这里就是用 web 登录网页啦，非常感谢下面链接里前人的工作给与的参考！

// 1. 我们要要从网页的表单拿到 formHash 和 cookie
// 2. 使用之前拿到的 cookie 请求得到验证码图片
// 3. 用 POST 完成登录
// 4. OAuth 相关的 formHash
// 5. 获得 OAuth 的 code
// 6. 使用 code 拿到 key
// 7. 保存所有信息

// Many TKS ref: https://github.com/czy0729/Bangumi/blob/master/src/screens/login/v2/index.tsx

const store: {
  formHash?: string | null
  code?: string | null
  loginInfo?: {
    email: string
    password: string
  }
  accessToken?: Token
} = {}

// TYPES
export interface webLoginProps {
  email: string
  password: string
  captcha: string
  savePassword: boolean
}

/**
 * LOGIN INIT 1
 *
 * 得表单 Hash 方便登录提交
 */
export async function getLoginFormHash() {
  const data = await webFetch(LOGIN.FORM_URL, {
    method: 'get',
    credentials: 'include',
    parseResponse: (data) => data,
  })
  const match = data.match(/<input type="hidden" name="formhash" value="(.+?)">/)
  if (match) store.formHash = match[1]
  else throw new LoginError('没找着 formHash')
}

/**
 * LOGIN INIT 2
 *
 * 在获得表单 Hash 的同时，访问 /login 可以获得 cookie。
 * 获得的 cookie 配合时间戳获得一个验证码图片
 *
 * @returns 由 `URL.createObjectURL` encode `blob` 后的图片地址
 */
export async function getCaptcha() {
  const data = await webFetch(LOGIN.CAPTCHA, {
    method: 'get',
    credentials: 'include',
    responseType: 'blob',
  })
  return URL.createObjectURL(data)
}

/**
 * LOGIN STEP 1
 *
 * Web 登录函数，直接往登录地址 POST 相关信息
 */
export async function webLogin({ email, password, captcha, savePassword }: webLoginProps) {
  const { _data: data, redirected } = await webFetch.raw(LOGIN.POST_URL, {
    method: 'post',
    headers: {
      'Content-Type': LOGIN.POST_CONTENT_TYPE,
    },
    body: new URLSearchParams({
      formhash: store.formHash!,
      referer: '',
      dreferer: '',
      email,
      password,
      captcha_challenge_field: captcha,
      loginsubmit: '登录',
    }),
    credentials: 'include',
    parseResponse: (data) => data,
  })

  if (data.includes('分钟内您将不能登录本站')) {
    throw new LoginError('尝试超过 5 次了的说，请 15 分钟后再试')
  }
  if (data.includes('验证码错误，请返回重试')) {
    throw new LoginError('验证码错误')
  }
  if (data.includes('用户名无效，密码错误')) {
    throw new LoginError('用户名或密码错误')
  }
  if (!redirected) throw new LoginError('未能完成登录，未知错误')
  if (savePassword) {
    store.loginInfo = { email, password }
  } else {
    store.loginInfo = undefined
  }
}

/**
 * LOGIN STEP 2
 *
 * 获得授权的表单 HASH
 */
export async function getOAuthFormHash() {
  const data = await webFetch(LOGIN.OAUTH_FORM_ULR, {
    method: 'get',
    credentials: 'include',
    parseResponse: (data) => data,
  })
  const doc = domParser.parseFromString(data, 'text/html')
  store.formHash = doc.querySelector('input[name=formhash]')?.getAttribute('value')
  if (!store.formHash) throw new LoginError('获得授权表单 Hash 失败')
}

/**
 * LOGIN STEP 3
 *
 * 模拟网页表单提交，获得 Authorization code
 *
 * 这里用了 Hack 的方法来获得，因为如果用浏览器发出，服务器会验证 Referer 字段，
 * 所以在 main 里将 Referer 修改成了 https://bgm.tv/oauth/authorize
 */
export async function getOAuthCode() {
  const { url } = await webFetch.raw(LOGIN.OAUTH_FORM_ULR, {
    method: 'post',
    credentials: 'include',
    headers: {
      'Content-Type': LOGIN.POST_CONTENT_TYPE,
    },
    body: new URLSearchParams({
      formhash: store.formHash!,
      redirect_uri: '',
      client_id: APP_ID,
      submit: '授权',
    }),
  })
  store.code = new URL(url).searchParams.get('code')
  if (!store.code) throw new LoginError('获取授权 code 失败')
}

/**
 * LOGIN STEP 4
 *
 * 使用 code 获得 Bearer (Access token)
 */
export async function getOAuthAccessToken() {
  if (!store.code) throw new LoginError('获取授权 code 失败')
  const token = await webFetch<Token>(LOGIN.OAUTH_ACCESS_TOKEN_URL, {
    method: 'post',
    headers: {
      'Content-Type': LOGIN.POST_CONTENT_TYPE,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: APP_ID,
      client_secret: APP_SECRET,
      code: store.code,
      redirect_uri: URL_OAUTH_REDIRECT,
      state: getTimestamp().toString(),
    }),
  })
  if (!token.access_token) throw new LoginError('获取 Bearer 失败')
  store.accessToken = token
  return token
}

/**
 * LOGIN STEP 5
 *
 * 保存登录信息
 */
export async function save() {
  await client.setAccessToken(store.accessToken!)
  if (store.loginInfo) {
    await client.setLoginInfo(store.loginInfo)
  }
}

/**
 * 刷新 token
 * @param refreshToken refresh token
 */
export async function refreshToken(refreshToken: string) {
  const token = await webFetch<Token>(LOGIN.OAUTH_ACCESS_TOKEN_URL, {
    method: 'post',
    headers: {
      'Content-Type': LOGIN.POST_CONTENT_TYPE,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: APP_ID,
      client_secret: APP_SECRET,
      refresh_token: refreshToken,
      redirect_uri: URL_OAUTH_REDIRECT,
    }),
  })
  if (!token) throw new LoginError('刷新 Token 失败')
  await client.setAccessToken(token)
}
