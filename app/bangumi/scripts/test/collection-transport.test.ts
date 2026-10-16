import { expect, test, vi } from 'vitest'
import * as snapshots from '../../src/shared/collection-sync'
import * as sync from '../../src/main/collection/sync'
import { createCollectionTransport } from '../../src/main/collection/transport'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), cookies: vi.fn() }))
vi.mock('electron', () => ({
  session: { defaultSession: { fetch: mocks.fetch, cookies: { get: mocks.cookies } } },
}))
vi.mock('../../src/main/lib/db', () => ({ sqlite: {} }))
vi.mock('drizzle-orm/better-sqlite3', () => ({
  drizzle: () => {
    const query = {
      select: () => query,
      from: () => query,
      where: () => query,
      orderBy: () => query,
      get: () => ({ access_token: 'test-token' }),
    }
    return query
  },
}))

function transport(fetch: (url: string) => Promise<Response>) {
  mocks.fetch.mockClear()
  mocks.fetch.mockImplementation(fetch)
  return createCollectionTransport(1, new AbortController().signal)
}
const profile = { id: 1, username: 'test-user' }
const collection = { ...snapshots.defaultCollection(), subject_id: 42 }
const subjectHtml = `<div id="dock"><ul><li><a href="/user/test-user">me</a></li></ul></div>
  <a onclick="eraseSubjectCollect(42, 'form-hash')">remove</a>`

function deletionTransport(webResponse: (path: string) => Response) {
  mocks.cookies.mockResolvedValue([{ name: 'chii_auth', value: 'web-session' }])
  return transport(async (url) => {
    const target = new URL(url)
    return target.hostname === 'api.bgm.tv' ? Response.json(profile) : webResponse(target.pathname)
  })
}

for (const endpoint of ['/subject/42', '/subject/42/remove']) {
  for (const [status, headers, html] of [
    [403, { 'cf-mitigated': 'challenge' }, 'challenge'],
    [503, { 'content-type': 'text/html' }, '<script>window._cf_chl_opt = {}</script>'],
    [200, { 'content-type': 'text/html' }, '<script>window._cf_chl_opt = {}</script>'],
  ] as const) {
    test(`deletion detects the CF challenge at ${endpoint} (${status})`, async () => {
      const client = deletionTransport((path) =>
        path === endpoint ? new Response(html, { status, headers }) : new Response(subjectHtml),
      )
      await expect(
        client.write(
          42,
          { ...snapshots.emptySnapshot(), collection },
          {
            ...snapshots.emptySnapshot(),
            collection: null,
          },
        ),
      ).rejects.toMatchObject({ kind: 'web-verification-required' })
      if (endpoint === '/subject/42')
        expect(mocks.fetch.mock.calls.some(([url]) => url.includes('/remove'))).toBe(false)
    })
  }
}

test.each([
  [403, 'web-auth-required'],
  [404, 'error'],
  [503, 'network'],
])('ordinary webpage HTTP %s is classified separately from CF', async (status, kind) => {
  const client = deletionTransport(() => new Response('unavailable', { status }))
  await expect(
    client.write(
      42,
      { ...snapshots.emptySnapshot(), collection },
      {
        ...snapshots.emptySnapshot(),
        collection: null,
      },
    ),
  ).rejects.toMatchObject({ kind })
})

test('normal CF JS detections do not block deletion and a retry reads fresh clearance cookies', async () => {
  const client = deletionTransport(
    () =>
      new Response(
        `${subjectHtml}<script src="/cdn-cgi/challenge-platform/h/g/scripts/jsd/main.js"></script>`,
        { headers: { 'content-type': 'text/html' } },
      ),
  )
  const before = { ...snapshots.emptySnapshot(), collection }
  const target = { ...snapshots.emptySnapshot(), collection: null }
  await client.write(42, before, target)
  mocks.cookies.mockResolvedValue([
    { name: 'chii_auth', value: 'web-session' },
    { name: 'cf_clearance', value: 'verified-session' },
  ])
  await client.write(42, before, target)
  const [, options] = mocks.fetch.mock.calls.at(-1)!
  expect(options.headers.Cookie).toContain('cf_clearance=verified-session')
})

test('subject refresh carries the server collection timestamp', async () => {
  const updated_at = '2026-09-04T12:00:00Z'
  const client = transport(async (url) => {
    const { pathname } = new URL(url)
    if (pathname === '/v0/me') return Response.json(profile)
    if (pathname.endsWith('/episodes')) return Response.json({ data: [], total: 0 })
    return Response.json({ ...collection, updated_at })
  })
  expect((await client.read(42)).updatedAt).toBe(Date.parse(updated_at))
})

test('collection pages respect the 50 item limit and preserve subsequent offsets', async () => {
  const offsets: number[] = []
  const client = transport(async (url) => {
    const { pathname, searchParams } = new URL(url)
    if (pathname === '/v0/me') return Response.json(profile)
    const limit = Number(searchParams.get('limit'))
    if (limit > 50) return new Response(null, { status: 400 })
    const offset = Number(searchParams.get('offset'))
    offsets.push(offset)
    return Response.json({
      data: Array.from({ length: Math.min(limit, 121 - offset) }, (_, i) => ({
        subject_id: offset + i,
      })),
      limit,
      total: 121,
    })
  })
  const ids: number[] = []
  let total = Infinity
  while (ids.length < total) {
    const page = await client.list(ids.length)
    total = page.total
    ids.push(...page.data.map((item) => item.subject_id))
  }
  expect(offsets).toEqual([0, 50, 100])
  expect(new Set(ids).size).toBe(121)
})

test('episode pages follow the documented 1000 item limit without truncating progress', async () => {
  const offsets: number[] = []
  const client = transport(async (url) => {
    const { pathname, searchParams } = new URL(url)
    if (pathname === '/v0/me') return Response.json(profile)
    if (!pathname.endsWith('/episodes')) return Response.json(collection)
    const limit = Number(searchParams.get('limit'))
    if (limit > 1000) return new Response(null, { status: 400 })
    const offset = Number(searchParams.get('offset'))
    offsets.push(offset)
    return Response.json({
      data: Array.from({ length: Math.min(limit, 1001 - offset) }, (_, i) => ({
        episode: { id: offset + i + 1 },
        type: 2,
      })),
      total: 1001,
    })
  })
  const result = await client.read(42)
  expect(offsets).toEqual([0, 1000])
  expect(result.episodes.length).toBe(1001)
  expect(Object.keys(result.snapshot.episodes).length).toBe(1001)
  expect(result.snapshot.episodesComplete).toBe(true)
})

for (const endpoint of ['/v0/me', '/collections?', '/collections/42', '/episodes?']) {
  test(`body failure at ${endpoint} remains retryable`, async () => {
    const client = transport(async (url) => {
      if (url.includes(endpoint)) {
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.error(new TypeError('connection dropped while reading body'))
            },
          }),
        )
      }
      return Response.json(url.endsWith('/v0/me') ? profile : collection)
    })
    await expect(endpoint === '/collections?' ? client.list(0) : client.read(42)).rejects.toSatisfy(
      (error: unknown) => error instanceof sync.SyncError && error.kind === 'network',
    )
  })
}

for (const [status, kind] of [
  [401, 'auth-required'],
  [400, 'error'],
  [503, 'network'],
] as const) {
  test(`HTTP ${status} keeps its ${kind} classification`, async () => {
    const client = transport(async () => new Response(null, { status }))
    await expect(client.list(0)).rejects.toSatisfy(
      (error: unknown) => error instanceof sync.SyncError && error.kind === kind,
    )
  })
}
