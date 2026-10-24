import { store } from '../../src/renderer/src/state/utils'
import {
  authRequiredUserIdAtom,
  sessionNeedsLoginAtom,
  userIdAtom,
} from '../../src/renderer/src/state/session'
import { loginDialogAtom } from '../../src/renderer/src/state/dialog/normal'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { FetchError } from 'ofetch'
import * as webAccess from '../../src/renderer/src/data/fetch/config/web-access'
import * as config from '../../src/renderer/src/data/fetch/config'
import * as session from '../../src/renderer/src/data/fetch/session'
import * as login from '../../src/renderer/src/data/fetch/web/login'
import { AuthError } from '../../src/renderer/src/lib/utils/error'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  readAccessToken: vi.fn(),
  insertAccessToken: vi.fn(),
  removeCookie: vi.fn(),
  collectionActivate: vi.fn(),
  verify: vi.fn(),
  parseHTML: vi.fn(),
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
  client: {
    removeCookie: mocks.removeCookie,
    collectionActivate: mocks.collectionActivate,
    requestBangumiWebVerification: mocks.verify,
  },
}))
vi.mock('@renderer/lib/utils/parser', () => ({ domParser: { parseFromString: mocks.parseHTML } }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.verify.mockRejectedValue(new Error('Bangumi 网页验证已取消。'))
  store.set(userIdAtom, '1')
  store.set(authRequiredUserIdAtom, null)
  store.set(loginDialogAtom, { open: false })
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
        oauthStatus === 400
          ? { error: 'invalid_grant', error_description: 'Refresh token has expired' }
          : { access_token: 'renewed', refresh_token: 'new-refresh', expires_in: 3600 },
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

test('opening or failing a login challenge keeps the previous collection account active', async () => {
  fixture()
  mocks.fetch.mockImplementation(async (input: RequestInfo | URL) =>
    String(input).includes('/signup/captcha')
      ? new Response('image', { headers: { 'Content-Type': 'image/png' } })
      : new Response('<input type="hidden" name="formhash" value="test-hash">'),
  )
  const captcha = await login.prepareWebLoginChallenge()
  URL.revokeObjectURL(captcha)
  expect(mocks.collectionActivate).not.toHaveBeenCalled()
  mocks.fetch.mockResolvedValue(new Response('login unavailable'))
  await expect(login.prepareWebLoginChallenge()).rejects.toThrow('formHash')
  expect(mocks.collectionActivate).not.toHaveBeenCalled()
})

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

const challengeHTML = '<script>window._cf_chl_opt = {}</script>'
function challenge(status = 403) {
  return new Response(challengeHTML, { status, headers: { 'content-type': 'text/html' } })
}

test.each([200, 403, 503])(
  'OAuth form challenge (%s) opens verification and resumes before parsing the hash',
  async (status) => {
    fixture()
    const form = '<input name="formhash" value="oauth-hash">'
    mocks.fetch.mockResolvedValueOnce(challenge(status)).mockResolvedValueOnce(new Response(form))
    mocks.verify.mockResolvedValue({})
    mocks.parseHTML.mockImplementation((html: string) => ({
      querySelector: () => (html === form ? { getAttribute: () => 'oauth-hash' } : null),
    }))
    await expect(login.getOAuthFormHash()).resolves.toBeUndefined()
    expect(mocks.parseHTML).toHaveBeenCalledExactlyOnceWith(form, 'text/html')
    expect(mocks.verify).toHaveBeenCalledExactlyOnceWith({
      url: expect.stringContaining('https://bgm.tv/oauth/authorize?'),
    })
    expect(mocks.fetch).toHaveBeenCalledTimes(2)
    expect(mocks.removeCookie).not.toHaveBeenCalled()
    expect(webAccess.isWebVerificationRequired()).toBe(false)
  },
)

test('captcha challenge returned as a successful HTML blob is verified before creating its URL', async () => {
  fixture()
  mocks.fetch
    .mockResolvedValueOnce(challenge(200))
    .mockResolvedValueOnce(new Response('image', { headers: { 'content-type': 'image/png' } }))
  mocks.verify.mockResolvedValue({})
  const url = await login.getCaptcha()
  expect(await (await fetch(url)).text()).toBe('image')
  URL.revokeObjectURL(url)
  expect(mocks.verify).toHaveBeenCalledExactlyOnceWith({ url: 'https://bgm.tv/login' })
})

test('verification retries a blocked POST once and preserves raw response metadata and body', async () => {
  fixture()
  const response = new Response('posted')
  Object.defineProperties(response, {
    url: { value: 'https://bgm.tv/group/topic/42#post_100' },
    redirected: { value: true },
  })
  mocks.fetch.mockResolvedValueOnce(challenge()).mockResolvedValueOnce(response)
  mocks.verify.mockResolvedValue({})
  const body = new URLSearchParams({ content: 'reply', formhash: 'hash' })
  const result = await config.webFetch.raw('/group/topic/42/new_reply', { method: 'POST', body })
  expect(result.redirected).toBe(true)
  expect(result.url).toBe('https://bgm.tv/group/topic/42#post_100')
  expect(result._data).toBe('posted')
  expect(mocks.verify).toHaveBeenCalledExactlyOnceWith({ url: 'https://bgm.tv/group/topic/42' })
  expect(mocks.fetch.mock.calls.map(([, options]) => options.body)).toEqual([body, body])
  expect(mocks.fetch.mock.calls.map(([, options]) => options.method)).toEqual(['POST', 'POST'])
})

test('concurrent webpage challenges share verification and retry their own requests', async () => {
  fixture()
  let complete!: (pages: Record<string, string>) => void
  mocks.verify.mockImplementation(() => new Promise((resolve) => (complete = resolve)))
  mocks.fetch.mockResolvedValueOnce(challenge()).mockResolvedValueOnce(challenge())
  const first = config.webFetch('/subject/42')
  const second = config.webFetch('/index/12')
  await vi.waitFor(() => expect(mocks.verify).toHaveBeenCalledTimes(1))
  mocks.fetch.mockImplementation(async (url: string) => new Response(url))
  complete({})
  await expect(Promise.all([first, second])).resolves.toEqual([
    'https://bgm.tv/subject/42',
    'https://bgm.tv/index/12',
  ])
  expect(mocks.verify).toHaveBeenCalledTimes(1)
})

test('a repeated challenge after verification stops without another popup or POST replay', async () => {
  fixture()
  mocks.fetch.mockImplementation(async () => challenge())
  mocks.verify.mockResolvedValue({})
  await expect(config.webFetch('/index/42/collect?gh=hash')).rejects.toThrow(
    webAccess.WebVerificationRequiredError,
  )
  expect(mocks.verify).toHaveBeenCalledExactlyOnceWith({ url: 'https://bgm.tv/index/42' })
  expect(mocks.fetch).toHaveBeenCalledTimes(2)
  expect(webAccess.isWebVerificationRequired()).toBe(true)
})

test('a cancelled popup leaves a manual recovery error and blocks repeated webpage requests', async () => {
  fixture()
  mocks.fetch.mockImplementation(async () => challenge(200))
  await expect(config.webFetch('/subject/42')).rejects.toMatchObject({
    name: 'WebVerificationRequiredError',
    url: 'https://bgm.tv/subject/42',
  })
  await expect(config.webFetch('/index/12')).rejects.toThrow(webAccess.WebVerificationRequiredError)
  expect(mocks.fetch).toHaveBeenCalledTimes(1)
  expect(mocks.verify).toHaveBeenCalledTimes(1)
})

test('a late challenge response after cancelling verification cannot open another popup', async () => {
  fixture()
  let respond!: (response: Response) => void
  mocks.fetch
    .mockImplementationOnce(() => new Promise((resolve) => (respond = resolve)))
    .mockResolvedValueOnce(challenge())
  const late = config.webFetch('/subject/42')
  const rejected = expect(late).rejects.toThrow(webAccess.WebVerificationRequiredError)
  await expect(config.webFetch('/index/12')).rejects.toThrow(webAccess.WebVerificationRequiredError)
  respond(challenge())
  await rejected
  expect(mocks.verify).toHaveBeenCalledTimes(1)
  expect(mocks.fetch).toHaveBeenCalledTimes(2)
})

test('requests started while a popup is open wait and retain verification errors on cancellation', async () => {
  fixture()
  let cancel!: (error: Error) => void
  mocks.verify.mockImplementation(() => new Promise((_, reject) => (cancel = reject)))
  mocks.fetch.mockImplementation(async () => challenge())
  const first = config.webFetch('/subject/42')
  const rejected = expect(first).rejects.toThrow(webAccess.WebVerificationRequiredError)
  await vi.waitFor(() => expect(mocks.verify).toHaveBeenCalledTimes(1))
  const waiting = config.webFetch('/index/12')
  const waitingRejected = expect(waiting).rejects.toMatchObject({
    name: 'WebVerificationRequiredError',
    url: 'https://bgm.tv/index/12',
  })
  expect(mocks.fetch).toHaveBeenCalledTimes(1)
  cancel(new Error('已取消'))
  await Promise.all([rejected, waitingRejected])
  expect(mocks.verify).toHaveBeenCalledTimes(1)
  expect(mocks.fetch).toHaveBeenCalledTimes(1)
})

test('aborting during verification prevents replaying the original action', async () => {
  fixture()
  let complete!: (pages: Record<string, string>) => void
  mocks.verify.mockImplementation(() => new Promise((resolve) => (complete = resolve)))
  mocks.fetch.mockImplementation(async () => challenge())
  const controller = new AbortController()
  const pending = config.webFetch('/index/42/collect?gh=hash', { signal: controller.signal })
  const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  await vi.waitFor(() => expect(mocks.verify).toHaveBeenCalledTimes(1))
  controller.abort()
  await rejected
  complete({})
  await vi.waitFor(() => expect(webAccess.isWebVerificationRequired()).toBe(false))
  expect(mocks.fetch).toHaveBeenCalledTimes(1)
})

test('passive CF scripts and ordinary missing OAuth form hashes never open verification', async () => {
  fixture()
  const html = '<script src="/cdn-cgi/challenge-platform/scripts/jsd/main.js"></script>'
  mocks.fetch.mockImplementation(
    async () => new Response(html, { headers: { 'content-type': 'text/html' } }),
  )
  mocks.parseHTML.mockReturnValue({ querySelector: () => null })
  await expect(login.getOAuthFormHash()).rejects.toThrow('获得授权表单 Hash 失败')
  expect(mocks.verify).not.toHaveBeenCalled()
  expect(webAccess.isWebVerificationRequired()).toBe(false)
})

test.each([400, 401, 403])(
  'rejected token refresh (%s) only schedules logout for confirmed expiration',
  async (status) => {
    fixture(status)
    const results = await Promise.allSettled([session.getAccessToken(), session.getAccessToken()])
    expect(results.every((result) => result.status === 'rejected')).toBe(true)
    await expect(session.getAccessToken()).rejects.toBeInstanceOf(
      status === 400 ? AuthError : FetchError,
    )
    expect(store.get(loginDialogAtom).open).toBe(false)
    expect(store.get(userIdAtom)).toBe('1')
    expect(store.get(sessionNeedsLoginAtom)).toBe(status === 400)
    expect(mocks.collectionActivate).not.toHaveBeenCalled()
  },
)

test('API 401 with confirmed refresh rejection becomes a session error without opening login', async () => {
  const f = fixture(400)
  mocks.readAccessToken.mockResolvedValue({
    ...f.expiredToken,
    create_time: new Date(),
    expires_in: 3600,
  })
  mocks.fetch.mockImplementation(async (input: RequestInfo | URL) =>
    Response.json({}, { status: String(input).endsWith('/oauth/access_token') ? 400 : 401 }),
  )
  await expect(config.apiFetchWithAuth('/v0/me')).rejects.toBeInstanceOf(AuthError)
  expect(store.get(loginDialogAtom).open).toBe(false)
  expect(store.get(userIdAtom)).toBe('1')
  expect(store.get(sessionNeedsLoginAtom)).toBe(true)
})

test('network refresh failure does not mark the saved account as expired', async () => {
  fixture(500)
  await expect(session.getAccessToken()).rejects.toBeInstanceOf(FetchError)
  expect(store.get(sessionNeedsLoginAtom)).toBe(false)
})

test('successful token recovery clears the re-login marker', async () => {
  const f = fixture()
  store.set(authRequiredUserIdAtom, '1')
  await session.safeRefreshToken(f.expiredToken)
  expect(store.get(sessionNeedsLoginAtom)).toBe(false)
})

test('a refresh failure for an old account cannot mark the active account expired', async () => {
  const f = fixture(400)
  store.set(userIdAtom, '2')
  await expect(session.safeRefreshToken(f.expiredToken)).rejects.toBeInstanceOf(FetchError)
  expect(store.get(sessionNeedsLoginAtom)).toBe(false)
})

test('confirmed online expiration signs out once without opening a dialog', async () => {
  fixture(400)
  await expect(session.getAccessToken()).rejects.toBeInstanceOf(AuthError)
  const results = await Promise.all([
    session.expireInvalidSession(),
    session.expireInvalidSession(),
  ])
  expect(results).toEqual([true, false])
  expect(store.get(userIdAtom)).toBeNull()
  expect(store.get(loginDialogAtom).open).toBe(false)
  expect(mocks.collectionActivate).toHaveBeenCalledExactlyOnceWith({ userId: null })
})

test('offline state keeps the remembered account even when an expiration signal is pending', async () => {
  fixture()
  store.set(authRequiredUserIdAtom, '1')
  vi.stubGlobal('navigator', { onLine: false })
  expect(await session.expireInvalidSession()).toBe(false)
  expect(store.get(userIdAtom)).toBe('1')
  expect(mocks.collectionActivate).not.toHaveBeenCalled()
})

test('OAuth client configuration errors do not sign the user out', async () => {
  fixture(400)
  mocks.fetch.mockImplementation(async () =>
    Response.json({ error: 'invalid_client' }, { status: 400 }),
  )
  await expect(session.getAccessToken()).rejects.toBeInstanceOf(FetchError)
  expect(await session.expireInvalidSession()).toBe(false)
  expect(store.get(userIdAtom)).toBe('1')
})

test('confirmed expiration blocks later refresh attempts until the logout completes', async () => {
  const f = fixture(400)
  await expect(session.getAccessToken()).rejects.toBeInstanceOf(AuthError)
  const results = await Promise.allSettled(
    Array.from({ length: 4 }, () => session.getAccessToken()),
  )
  expect(
    results.every((result) => result.status === 'rejected' && result.reason instanceof AuthError),
  ).toBe(true)
  expect(f.requests).toHaveLength(1)
  expect(await session.expireInvalidSession()).toBe(true)
  expect(await session.getAccessToken()).toBeNull()
  expect(f.requests).toHaveLength(1)
})

test.each([
  { error: 'invalid_request', error_description: 'Invalid refresh token' },
  { error: 'invalid_refresh_token' },
])('legacy OAuth rejection %j schedules one logout without a raw 400 error', async (body) => {
  fixture()
  mocks.fetch.mockImplementation(async () => Response.json(body, { status: 400 }))
  await expect(session.getAccessToken()).rejects.toBeInstanceOf(AuthError)
  expect(store.get(sessionNeedsLoginAtom)).toBe(true)
  expect(await session.expireInvalidSession()).toBe(true)
  expect(store.get(userIdAtom)).toBeNull()
  expect(mocks.fetch).toHaveBeenCalledTimes(1)
})

test.each([400, 401])(
  'ambiguous refresh 400 only expires after token_status rejects it (%s)',
  async (status) => {
    const f = fixture()
    mocks.fetch.mockImplementation(async (input) =>
      Response.json(
        String(input).endsWith('/oauth/token_status') ? { error: 'invalid_token' } : {},
        { status: String(input).endsWith('/oauth/token_status') ? status : 400 },
      ),
    )
    await expect(session.getAccessToken()).rejects.toBeInstanceOf(AuthError)
    expect(store.get(sessionNeedsLoginAtom)).toBe(true)
    expect(mocks.fetch).toHaveBeenLastCalledWith(
      'https://bgm.tv/oauth/token_status',
      expect.objectContaining({ retry: 0 }),
    )
    expect(f.saved).toHaveLength(0)
  },
)

test.each(['valid', 'network', 'challenge'] as const)(
  'ambiguous refresh 400 keeps the account when token status is %s',
  async (status) => {
    fixture()
    mocks.fetch.mockImplementation(async (input) => {
      if (!String(input).endsWith('/oauth/token_status')) return Response.json({}, { status: 400 })
      if (status === 'network') throw new TypeError('Failed to fetch')
      if (status === 'challenge') return challenge()
      return Response.json({ user_id: 1 })
    })
    await expect(session.getAccessToken()).rejects.toBeInstanceOf(FetchError)
    expect(store.get(sessionNeedsLoginAtom)).toBe(false)
    expect(await session.expireInvalidSession()).toBe(false)
    expect(store.get(userIdAtom)).toBe('1')
    expect(mocks.fetch).toHaveBeenCalledTimes(2)
  },
)

test('another window replacing a rejected refresh token recovers without signing out', async () => {
  const f = fixture(400)
  const latest = {
    ...f.expiredToken,
    access_token: 'other-window-token',
    refresh_token: 'other-window-refresh',
    create_time: new Date(),
    expires_in: 3600,
  }
  mocks.readAccessToken.mockResolvedValueOnce(f.expiredToken).mockResolvedValue(latest)
  await expect(session.getAccessToken()).resolves.toBe(latest)
  expect(store.get(sessionNeedsLoginAtom)).toBe(false)
  expect(mocks.insertAccessToken).not.toHaveBeenCalled()
  expect(f.requests).toHaveLength(1)
  await expect(session.getAccessToken()).resolves.toBe(latest)
})

test.each([200, 400])(
  'an old refresh response (%s) after a fresh login cannot overwrite or expire it',
  async (status) => {
    fixture()
    let respond!: (response: Response) => void
    mocks.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          respond = resolve
        }),
    )
    const pending = session.getAccessToken()
    const cancelled = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1))
    // Successful login rotates this session even if the same user stays selected.
    session.cleanAccessTokenCache()
    respond(
      Response.json(
        status === 400
          ? { error: 'invalid_grant' }
          : { access_token: 'obsolete', refresh_token: 'obsolete', expires_in: 3600 },
        { status },
      ),
    )
    await cancelled
    expect(mocks.insertAccessToken).not.toHaveBeenCalled()
    expect(store.get(sessionNeedsLoginAtom)).toBe(false)
    expect(store.get(userIdAtom)).toBe('1')
  },
)

test.each([200, 401])(
  'an old API response (%s) cannot retry with the newly selected account',
  async (status) => {
    const f = fixture()
    mocks.readAccessToken.mockResolvedValue({
      ...f.expiredToken,
      create_time: new Date(),
      expires_in: 3600,
    })
    let respond!: (response: Response) => void
    mocks.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          respond = resolve
        }),
    )
    const pending = config.apiFetchWithOptionalAuth('/v0/me')
    const cancelled = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1))
    store.set(userIdAtom, '2')
    respond(Response.json({ id: 1 }, { status }))
    await cancelled
    expect(mocks.fetch).toHaveBeenCalledTimes(1)
    expect(store.get(userIdAtom)).toBe('2')
    expect(store.get(sessionNeedsLoginAtom)).toBe(false)
  },
)

test('a normal API parameter 400 never refreshes or expires the account', async () => {
  const f = fixture()
  mocks.readAccessToken.mockResolvedValue({
    ...f.expiredToken,
    create_time: new Date(),
    expires_in: 3600,
  })
  mocks.fetch.mockImplementation(async () =>
    Response.json({ error: 'invalid parameters' }, { status: 400 }),
  )
  await expect(config.apiFetchWithAuth('/v0/me')).rejects.toBeInstanceOf(FetchError)
  expect(mocks.fetch).toHaveBeenCalledTimes(1)
  expect(store.get(sessionNeedsLoginAtom)).toBe(false)
  expect(await session.expireInvalidSession()).toBe(false)
  expect(store.get(userIdAtom)).toBe('1')
})
