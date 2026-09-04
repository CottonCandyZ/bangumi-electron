import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { desc, eq } from 'drizzle-orm'
import { userSession } from '../../src/db/schema/user'
import * as snapshots from '../../src/shared/collection-sync'
import * as sync from '../../src/main/collection/sync'

// Execute the real transport with only Electron and its session database replaced.
const source = ts.transpileModule(
  readFileSync(new URL('../../src/main/collection/transport.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText
function transport(fetch: (url: string) => Promise<Response>) {
  const query = {
    select: () => query,
    from: () => query,
    where: () => query,
    orderBy: () => query,
    get: () => ({ access_token: 'test-token' }),
  }
  const modules = {
    electron: { session: { defaultSession: { fetch } } },
    'drizzle-orm': { desc, eq },
    'drizzle-orm/better-sqlite3': { drizzle: () => query },
    '../../db/schema/user': { userSession },
    '../lib/db': { sqlite: {} },
    '../../shared/collection-sync': snapshots,
    './sync': sync,
  }
  const exports = {} as typeof import('../../src/main/collection/transport')
  runInNewContext(source, {
    exports,
    AbortSignal,
    require: (name: keyof typeof modules) => {
      assert.ok(name in modules, `Unexpected dependency: ${name}`)
      return modules[name]
    },
  })
  return exports.createCollectionTransport(1, new AbortController().signal)
}
const profile = { id: 1, username: 'test-user' }
const collection = { ...snapshots.defaultCollection(), subject_id: 42 }

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
  assert.deepEqual(offsets, [0, 50, 100])
  assert.equal(new Set(ids).size, 121)
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
  assert.deepEqual(offsets, [0, 1000])
  assert.equal(result.episodes.length, 1001)
  assert.equal(Object.keys(result.snapshot.episodes).length, 1001)
  assert.equal(result.snapshot.episodesComplete, true)
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
    await assert.rejects(
      endpoint === '/collections?' ? client.list(0) : client.read(42),
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
    await assert.rejects(
      client.list(0),
      (error: unknown) => error instanceof sync.SyncError && error.kind === kind,
    )
  })
}
