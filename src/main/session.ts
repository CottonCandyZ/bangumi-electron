import { session } from 'electron'

session.defaultSession.webRequest.onBeforeSendHeaders(
  { urls: ['https://*.bgm.tv/*'] },
  (details, callback) => {
    if (details.url.startsWith('https://bgm.tv/oauth/authorize')) {
      details.requestHeaders['Referer'] = 'https://bgm.tv/oauth/authorize'
    }
    details.requestHeaders['User-Agent'] =
      'CottonCandyZ/bangumi-electron/0.0.1 (Electron) (https://github.com/CottonCandyZ/bangumi-electron)'
    callback({ requestHeaders: details.requestHeaders })
  },
)

session.defaultSession.webRequest.onHeadersReceived(
  { urls: ['https://bgm.tv/*', 'https://lain.bgm.tv/*'] },
  (details, callback) => {
    details.responseHeaders!['Access-Control-Allow-Origin'] = ['http://localhost:5173']
    details.responseHeaders!['Access-Control-Allow-Credentials'] = ['true']
    if (details.responseHeaders!['set-cookie']) {
      details.responseHeaders!['set-cookie'] = details.responseHeaders!['set-cookie'].map(
        (item) => {
          if (item.includes('chii_auth')) item += '; Max-Age=7776000'
          return (item += '; SameSite=None; Secure')
        },
      )
    }
    callback({ responseHeaders: details.responseHeaders })
  },
)
