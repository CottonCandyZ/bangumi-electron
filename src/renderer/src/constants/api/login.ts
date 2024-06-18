import { APP_ID, APP_SECRET, HOST, LOGIN, URL_OAUTH_REDIRECT } from '@renderer/constants/config'
import { client } from '@renderer/lib/client'
import { getTimestamp } from '@renderer/lib/utils/date'
import { LoginError } from '@renderer/lib/utils/error'
import { ofetch } from 'ofetch'

// Many TKS ref: https://github.com/czy0729/Bangumi/blob/master/src/screens/login/v2/index.tsx

const store: {
  formHash?: string | null
  code?: string | null
  loginInfo: {
    email?: string
    password?: string
  }
  accessToken: {
    access_token?: string
    expires_in?: number
    refresh_token?: string
  }
} = {
  loginInfo: {},
  accessToken: {},
}

// TYPES

export interface webLoginProps {
  email: string
  password: string
  captcha: string
  save_password: boolean
}

/**
 * LOGIN INIT 1
 *
 * 得表单 Hash 方便登录提交
 */
export async function getLoginFormHash() {
  const data = await ofetch(LOGIN.FORM_URL, {
    method: 'get',
    baseURL: HOST,
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
  const data = await ofetch(LOGIN.CAPTCHA, {
    method: 'get',
    baseURL: HOST,
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
export async function webLogin({ email, password, captcha, save_password }: webLoginProps) {
  const { _data: data, redirected } = await ofetch.raw(LOGIN.POST_URL, {
    method: 'post',
    baseURL: HOST,
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
  if (save_password) {
    store.loginInfo.email = email
    store.loginInfo.password = password
  } else {
    store.loginInfo = {}
  }
}

/**
 * LOGIN STEP 2
 *
 * 获得授权的表单 HASH
 */
export async function getOAuthFormHash() {
  const data = await ofetch(LOGIN.OAUTH_FORM_ULR, {
    method: 'get',
    baseURL: HOST,
    credentials: 'include',
    parseResponse: (data) => data,
  })
  const parse = new DOMParser()
  const doc = parse.parseFromString(data, 'text/html')
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
  const { url } = await ofetch.raw(LOGIN.OAUTH_FORM_ULR, {
    method: 'post',
    baseURL: HOST,
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
  const json = (await ofetch(LOGIN.OAUTH_ACCESS_TOKEN_URL, {
    method: 'post',
    baseURL: HOST,
    headers: {
      'Content-Type': LOGIN.POST_CONTENT_TYPE,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: APP_ID,
      client_secret: APP_SECRET,
      code: store.code!,
      redirect_uri: URL_OAUTH_REDIRECT,
      state: getTimestamp().toString(),
    }),
  })) as (typeof store)['accessToken']
  if (!json.access_token) throw new LoginError('获取 Bearer 失败')
  store.accessToken = json
}

/**
 * LOGIN STEP 5
 *
 * 保存登录信息
 */
export async function save() {
  await client.saveAccessToken(store.accessToken as Required<typeof store.accessToken>)
  if (store.loginInfo.email) {
    await client.saveLoginInfo(store.loginInfo as Required<typeof store.loginInfo>)
  }
}
