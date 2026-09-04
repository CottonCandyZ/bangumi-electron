import { expect, test, vi } from 'vitest'
import * as snapshots from '../../src/shared/collection-sync'
import * as sync from '../../src/main/collection/sync'
import { createCollectionTransport } from '../../src/main/collection/transport'

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }))
vi.mock('electron', () => ({ session: { defaultSession: { fetch: mocks.fetch } } }))
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
  mocks.fetch.mockImplementation(fetch)
  return createCollectionTransport(1, new AbortController().signal)
}
const profile = { id: 1, username: 'test-user' }
const collection = { ...snapshots.defaultCollection(), subject_id: 42 }

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
