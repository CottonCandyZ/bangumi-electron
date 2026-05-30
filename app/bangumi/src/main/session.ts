import { session } from 'electron'

session.defaultSession.webRequest.onBeforeSendHeaders(
  { urls: ['https://*.bgm.tv/*'] },
  (details, callback) => {
    if (details.url.startsWith('https://bgm.tv/')) {
      details.requestHeaders['Referer'] = 'https://bgm.tv/'
      details.requestHeaders['Origin'] = 'https://bgm.tv'
    }
    if (details.url.startsWith('https://next.bgm.tv/')) {
      details.requestHeaders['Referer'] = 'https://next.bgm.tv/'
      details.requestHeaders['Origin'] = 'https://next.bgm.tv'
    }
    details.requestHeaders['User-Agent'] =
      'CottonCandyZ/bangumi-electron/0.0.1 (Electron) (https://github.com/CottonCandyZ/bangumi-electron)'
    callback({ requestHeaders: details.requestHeaders })
  },
)

session.defaultSession.webRequest.onHeadersReceived(
  { urls: ['https://bgm.tv/*', 'https://lain.bgm.tv/*', 'https://next.bgm.tv/*'] },
  (details, callback) => {
    const responseHeaders = details.responseHeaders ?? {}
    responseHeaders['Access-Control-Allow-Origin'] = ['http://localhost:5173']
    responseHeaders['Access-Control-Allow-Credentials'] = ['true']
    responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, PUT, PATCH, DELETE, OPTIONS']
    responseHeaders['Access-Control-Allow-Headers'] = [
      'authorization, content-type, accept, origin, x-requested-with',
    ]
    responseHeaders['Access-Control-Max-Age'] = ['86400']

    const setCookie = responseHeaders['Set-Cookie'] ?? responseHeaders['set-cookie']
    if (setCookie) {
      responseHeaders['Set-Cookie'] = setCookie.map((item) => {
        if (item.includes('chii_auth')) item += '; Max-Age=7776000'
        return (item += '; SameSite=None; Secure')
      })
      delete responseHeaders['set-cookie']
    }

    callback({
      responseHeaders,
      statusLine: details.method === 'OPTIONS' ? 'HTTP/1.1 204 No Content' : undefined,
    })
  },
)
