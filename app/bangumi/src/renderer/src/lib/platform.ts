import { client } from './client'

export const platform = await client.platform({})
export const isWindows = platform === 'win32'

document.documentElement.dataset.platform = platform

if (isWindows) {
  document.documentElement.classList.add('windows-native-scrollbars')
}
