import { HOST, UA, WEB_LOGIN } from '@renderer/constants/config'
import { ofetch } from 'ofetch'

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
  else throw Error('没找着 formHash')
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
