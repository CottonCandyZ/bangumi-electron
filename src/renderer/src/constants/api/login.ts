import { HOST, WEB_LOGIN } from '@renderer/constants/config'
import { LoginError } from '@renderer/lib/utils/error'
import { urlStringify } from '@renderer/lib/utils/tool'
import { ofetch } from 'ofetch'

// Many TKS ref: https://github.com/czy0729/Bangumi/blob/master/src/screens/login/v2/index.tsx

const store: {
  formHash: undefined | string
} = {
  formHash: undefined,
}

export async function getLoginFormHash() {
  const data = await ofetch(WEB_LOGIN.FORM_URL, {
    method: 'get',
    baseURL: HOST,
    credentials: 'include',
    parseResponse: (data) => data,
  })
  const match = data.match(/<input type="hidden" name="formhash" value="(.+?)">/)
  if (match) store.formHash = match[1]
  else throw new LoginError('没找着 formHash')
}

export async function getCaptcha() {
  const data = await ofetch(WEB_LOGIN.CAPTCHA, {
    method: 'get',
    baseURL: HOST,
    credentials: 'include',
    responseType: 'blob',
  })
  return URL.createObjectURL(data)
}

export interface webLoginProps {
  email: string
  password: string
  captcha: string
  save_password: boolean
}

export async function webLogin({ email, password, captcha, save_password }: webLoginProps) {
  const { _data: data, redirected } = await ofetch.raw(WEB_LOGIN.POST_URL, {
    method: 'post',
    baseURL: HOST,
    headers: {
      'Content-Type': WEB_LOGIN.POST_CONTENT_TYPE,
    },
    body: urlStringify({
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
}
