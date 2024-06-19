import { ofetch } from 'ofetch'

export async function getImage(url: string) {
  const data = await ofetch(url, {
    method: 'get',
    credentials: 'include',
    responseType: 'blob',
  })
  return URL.createObjectURL(data)
}
