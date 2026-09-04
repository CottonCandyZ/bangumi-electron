import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { FetchError } from 'ofetch'
import * as webAccess from '../../src/renderer/src/data/fetch/config/web-access'
import * as config from '../../src/renderer/src/data/fetch/config'
import * as session from '../../src/renderer/src/data/fetch/session'
import * as login from '../../src/renderer/src/data/fetch/web/login'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  readAccessToken: vi.fn(),
  insertAccessToken: vi.fn(),
  storeSet: vi.fn(),
  removeCookie: vi.fn(),
  collectionActivate: vi.fn(),
}))
vi.mock('ofetch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ofetch')>()
  return { ...actual, ofetch: actual.createFetch({ fetch: mocks.fetch }) }
})
vi.mock('@renderer/data/fetch/db/user', () => ({
  readAccessToken: mocks.readAccessToken,
  insertAccessToken: mocks.insertAccessToken,
  insertLoginInfo: vi.fn(),
}))
vi.mock('@renderer/lib/client', () => ({
  client: { removeCookie: mocks.removeCookie, collectionActivate: mocks.collectionActivate },
}))
vi.mock('@renderer/state/utils', () => ({ store: { get: () => '1', set: mocks.storeSet } }))
vi.mock('@renderer/state/session', () => ({ userIdAtom: {} }))
vi.mock('@renderer/state/dialog/normal', () => ({ loginDialogAtom: {} }))
vi.mock('@renderer/lib/utils/parser', () => ({ domParser: {} }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('navigator', { onLine: true })
  session.cleanAccessTokenCache()
  webAccess.markWebVerificationComplete()
})
afterEach(() => {
  session.cleanAccessTokenCache()
  webAccess.markWebVerificationComplete()
  vi.unstubAllGlobals()
})

// Exercise the real session -> login -> fetch chain with only external I/O mocked.
function fixture(oauthStatus = 200, captchaStatus = 200) {
  const requests: string[] = []
  const saved: unknown[] = []
  const expiredToken = {
    access_token: 'expired',
    refresh_token: 'valid-refresh',
    user_id: 1,
    expires_in: 1,
    create_time: new Date(0),
    token_type: 'Bearer',
  }
  mocks.readAccessToken.mockResolvedValue(expiredToken)
  mocks.insertAccessToken.mockImplementation(async (token: unknown) => {
    saved.push(token)
  })
  mocks.fetch.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input)
    requests.push(url)
    if (url.endsWith('/oauth/access_token'))
      return Response.json(
        { access_token: 'renewed', refresh_token: 'new-refresh', expires_in: 3600 },
        { status: oauthStatus },
      )
    if (url.endsWith('/oauth/token_status')) return Response.json({ user_id: '1' })
    if (url.includes('/signup/captcha'))
      return new Response('test-image', {
        status: captchaStatus,
        headers:
          captchaStatus === 403
            ? { 'cf-mitigated': 'challenge', 'Content-Type': 'text/html' }
            : { 'Content-Type': 'image/png' },
      })
    return new Response('Cloudflare challenge', {
      status: 403,
      headers: { 'cf-mitigated': 'challenge' },
    })
  })
  return {
    config,
    session,
    login,
    requests,
    saved,
    expiredToken,
    get logouts() {
      return mocks.removeCookie.mock.calls.length
    },
  }
}

test('a webpage challenge cannot log out an expired session with a valid refresh token', async () => {
  const f = fixture()
  await expect(f.config.webFetch('/anime/browser')).rejects.toThrow(
    webAccess.WebVerificationRequiredError,
  )
  const tokens = await Promise.all([f.session.getAccessToken(), f.session.getAccessToken()])
  expect(tokens.every((token) => token?.access_token === 'renewed')).toBeTruthy()
  expect(f.logouts).toBe(0)
  expect(f.saved.length).toBe(1)
  expect(f.requests.filter((url) => url.endsWith('/oauth/access_token')).length).toBe(1)
  expect(webAccess.isWebVerificationRequired()).toBe(true)
  await expect(f.config.webFetch('/game/browser')).rejects.toThrow(
    webAccess.WebVerificationRequiredError,
  )
  expect(f.requests.length).toBe(2)
})

test('a previously blocked trends request does not block the login captcha', async () => {
  const f = fixture()
  webAccess.markWebVerificationRequired()
  const image = await f.login.getCaptcha()
  expect(image.startsWith('blob:')).toBeTruthy()
  URL.revokeObjectURL(image)
  expect(f.requests.length).toBe(1)
  expect(webAccess.isWebVerificationRequired()).toBe(true)
})

test('an actual captcha 403 requests verification instead of returning an HTML image', async () => {
  const f = fixture(200, 403)
  await expect(f.login.getCaptcha()).rejects.toThrow(webAccess.WebVerificationRequiredError)
  expect(f.requests.length).toBe(1)
  expect(webAccess.isWebVerificationRequired()).toBe(true)
})

test('token status checks bypass a pending webpage challenge', async () => {
  const f = fixture()
  webAccess.markWebVerificationRequired()
  expect(await f.session.isAccessTokenValid(f.expiredToken)).toBe(true)
  expect(f.requests.length).toBe(1)
  expect(webAccess.isWebVerificationRequired()).toBe(true)
})

test('OAuth rejection remains an OAuth error and does not activate the webpage gate', async () => {
  const f = fixture(403)
  await expect(f.config.oauthFetch('/oauth/access_token', { method: 'POST' })).rejects.toThrow(
    FetchError,
  )
  expect(webAccess.isWebVerificationRequired()).toBe(false)
  expect(f.requests.length).toBe(1)
})

test('ordinary permission 403 does not activate the global verification gate', async () => {
  fixture()
  mocks.fetch.mockResolvedValue(new Response('permission denied', { status: 403 }))
  await expect(config.webFetch('/subject/42/interest/update', { method: 'POST' })).rejects.toThrow(
    FetchError,
  )
  expect(webAccess.isWebVerificationRequired()).toBe(false)
  mocks.fetch.mockResolvedValue(new Response('ok'))
  await expect(config.webFetch('/anime/browser')).resolves.toBe('ok')
})

test('challenge HTML without exposed headers is recognized for text and captcha blobs', async () => {
  fixture()
  const html = '<script>window._cf_chl_opt = {}</script>'
  mocks.fetch.mockImplementation(
    async () => new Response(html, { status: 403, headers: { 'content-type': 'text/html' } }),
  )
  await expect(config.webFetch('/anime/browser')).rejects.toThrow(
    webAccess.WebVerificationRequiredError,
  )
  webAccess.markWebVerificationComplete()
  await expect(login.getCaptcha()).rejects.toThrow(webAccess.WebVerificationRequiredError)
})
