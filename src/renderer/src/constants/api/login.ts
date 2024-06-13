import { HOST, UA, WEB_LOGIN } from '@renderer/constants/config'

const store: {
  cookie: string[]
  formHash: undefined | string
} = {
  cookie: [],
  formHash: undefined,
}

export async function getLoginFormHash() {
  const { data, cookie } = await window.api.fetchRaw(WEB_LOGIN.FORM_URL, {
    method: 'get',
    baseURL: HOST,
    headers: {
      'User-Agent': UA,
    },
  })
  const match = data.match(/<input type="hidden" name="formhash" value="(.+?)">/)
  store.cookie.push(...cookie)
  if (match) store.formHash = match[1]
  else throw Error('没找着 formHash')
}

export async function getCaptcha() {
  const data = await window.api.fetch(WEB_LOGIN.CAPTCHA, {
    method: 'get',
    baseURL: HOST,
    headers: {
      'User-Agent': UA,
      Cookie: store.cookie.join(''),
    },
    responseType: 'arrayBuffer',
  })
  const imageBlob = new Blob([new Uint8Array(data)], { type: 'image/gif' })
  return URL.createObjectURL(imageBlob)
}
