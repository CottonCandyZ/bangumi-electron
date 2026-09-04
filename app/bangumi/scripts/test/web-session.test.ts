import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test, type TestContext } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { createFetch, FetchError } from 'ofetch'
import * as webAccess from '../../src/renderer/src/data/fetch/config/web-access'
import * as promises from '../../src/renderer/src/lib/utils/promise'
import * as errors from '../../src/renderer/src/lib/utils/error'

// Load the actual session -> login -> fetch chain without the renderer, database or network.
function fixture(t: TestContext, oauthStatus = 200) {
  webAccess.markWebVerificationComplete()
  t.after(webAccess.markWebVerificationComplete)
  let logouts = 0
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
  const database = {
    readAccessToken: async () => expiredToken,
    insertAccessToken: async (token: unknown) => {
      saved.push(token)
    },
  }
  const fetcher = createFetch({
    fetch: async (input) => {
      const url = String(input)
      requests.push(url)
      if (url.endsWith('/oauth/access_token')) {
        return Response.json(
          { access_token: 'renewed', refresh_token: 'new-refresh', expires_in: 3600 },
          { status: oauthStatus },
        )
      }
      if (url.endsWith('/oauth/token_status')) return Response.json({ user_id: '1' })
      return new Response('Cloudflare challenge', {
        status: 403,
        headers: { 'cf-mitigated': 'challenge' },
      })
    },
  })
  const modules: Record<string, unknown> = {
    ofetch: { ofetch: fetcher, FetchError },
    '@renderer/data/fetch/config/web-access': webAccess,
    '@renderer/lib/utils/promise': promises,
    '@renderer/lib/utils/error': errors,
    '@renderer/data/fetch/db/user': database,
    './db/user': database,
    '@renderer/data/hooks/session': {
      safeLogout: async () => {
        logouts++
      },
    },
    '@renderer/lib/client': { client: {} },
    '@renderer/state/utils': { store: { get: () => '1' } },
    '@renderer/state/session': { userIdAtom: {} },
    '@renderer/lib/utils/parser': { domParser: {} },
    '@renderer/lib/utils/date': { getTimestamp: () => 0 },
    '@renderer/data/fetch/config/path': {
      AuthorizationHeader: (token: string) => `Bearer ${token}`,
    },
  }
  const sources: Record<string, string> = {
    '@renderer/data/fetch/config/': 'config/base.ts',
    '@renderer/data/fetch/session': 'session.ts',
    '@renderer/data/fetch/web/login': 'web/login.ts',
  }
  function load(name: string): unknown {
    if (name in modules) return modules[name]
    assert.ok(name in sources, `Unexpected dependency: ${name}`)
    const exports = {}
    modules[name] = exports
    const code = readFileSync(
      new URL(`../../src/renderer/src/data/fetch/${sources[name]}`, import.meta.url),
      'utf8',
    )
    const compiled = ts.transpileModule(code.replaceAll('import.meta.env.', 'testEnv.'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    runInNewContext(compiled, {
      exports,
      require: load,
      testEnv: {},
      Headers,
      URLSearchParams,
      Date,
    })
    return exports
  }
  const config = load(
    '@renderer/data/fetch/config/',
  ) as typeof import('../../src/renderer/src/data/fetch/config')
  Object.assign(config, {
    LOGIN: {
      OAUTH_ACCESS_TOKEN_URL: '/oauth/access_token',
      OAUTH_ACCESS_TOKEN_STATUS: '/oauth/token_status',
      POST_CONTENT_TYPE: 'application/x-www-form-urlencoded',
    },
  })
  const session = load(
    '@renderer/data/fetch/session',
  ) as typeof import('../../src/renderer/src/data/fetch/session')
  return {
    config,
    session,
    requests,
    saved,
    expiredToken,
    get logouts() {
      return logouts
    },
  }
}

test('a webpage challenge cannot log out an expired session with a valid refresh token', async (t) => {
  const f = fixture(t)
  await assert.rejects(f.config.webFetch('/anime/browser'), webAccess.WebVerificationRequiredError)
  const tokens = await Promise.all([f.session.getAccessToken(), f.session.getAccessToken()])
  assert.ok(tokens.every((token) => token?.access_token === 'renewed'))
  assert.equal(f.logouts, 0)
  assert.equal(f.saved.length, 1)
  assert.equal(f.requests.filter((url) => url.endsWith('/oauth/access_token')).length, 1)
  assert.equal(webAccess.isWebVerificationRequired(), true)
  await assert.rejects(f.config.webFetch('/game/browser'), webAccess.WebVerificationRequiredError)
  assert.equal(f.requests.length, 2)
})

test('token status checks bypass a pending webpage challenge', async (t) => {
  const f = fixture(t)
  webAccess.markWebVerificationRequired()
  assert.equal(await f.session.isAccessTokenValid(f.expiredToken), true)
  assert.equal(f.requests.length, 1)
  assert.equal(webAccess.isWebVerificationRequired(), true)
})

test('OAuth rejection remains an OAuth error and does not activate the webpage gate', async (t) => {
  const f = fixture(t, 403)
  await assert.rejects(f.config.oauthFetch('/oauth/access_token', { method: 'POST' }), FetchError)
  assert.equal(webAccess.isWebVerificationRequired(), false)
  assert.equal(f.requests.length, 1)
})
