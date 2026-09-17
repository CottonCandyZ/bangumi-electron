import { expect, test, vi, type TestContext } from 'vitest'
import { Worker } from 'node:worker_threads'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { CollectionRpc } from '../../src/main/collection/rpc'
import type { DataApi } from '../../src/main/collection/service'
import {
  defaultCollection,
  type CollectionSnapshot,
  type RemoteCollection,
} from '../../src/shared/collection-sync'
import { SyncError } from '../../src/main/collection/sync'
import { CollectionRepository } from '../../src/main/collection/repository'
import type { Subject } from '../../src/shared/types/subject'

function fixture(t: TestContext, network: object = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'bangumi-worker-test-'))
  const filename = join(directory, 'test.sqlite')
  const sqlite = new Database(filename)
  sqlite.pragma('journal_mode = WAL')
  migrate(drizzle(sqlite), { migrationsFolder: './drizzle' })
  const require = createRequire(import.meta.url)
  const entry = fileURLToPath(new URL('../../src/main/collection/worker.ts', import.meta.url))
  const worker = new Worker(
    `require(${JSON.stringify(require.resolve('tsx/cjs'))}); require(${JSON.stringify(entry)});`,
    {
      workerData: { filename },
      eval: true,
    },
  )
  const rpc = new CollectionRpc<DataApi>(worker, network)
  worker.on('error', (error) => rpc.fail(error))
  worker.on('exit', (code) => rpc.fail(new Error(`Worker exited: ${code}`)))
  t.onTestFinished(async () => {
    await worker.terminate()
    sqlite.close()
    rmSync(directory, { recursive: true, force: true })
  })
  return { rpc, sqlite }
}

test('collection worker persists commands, reads pages and survives rejected operations', async (t) => {
  const { rpc, sqlite } = fixture(t)
  await rpc.call('collectionCommand', {
    userId: 1,
    subjectId: 42,
    actionId: 'worker-edit',
    kind: 'edit',
    patch: { type: 3, rate: 9 },
  })
  expect(await rpc.call('collectionRead', { userId: 1, subjectId: 42 })).toMatchObject({ rate: 9 })
  expect(await rpc.call('collectionList', { userId: 1, online: false })).toMatchObject({ total: 1 })
  await expect(
    rpc.call('collectionCommand', {
      userId: 1,
      subjectId: 42,
      actionId: 'invalid',
      kind: 'edit',
      patch: { rate: 99 },
    }),
  ).rejects.toThrow('评分')
  expect((await rpc.call('collectionOverview', { userId: 1 })).pending).toBe(1)
  expect(sqlite.prepare('select count(*) as n from CollectionAction').get()).toEqual({ n: 1 })
}, 15000)

test('pending network requests do not block local reads/edits, and sync verifies the latest edit', async (t) => {
  let state: CollectionSnapshot = {
    collection: { ...defaultCollection(), rate: 7 },
    episodes: {},
    episodesComplete: true,
  }
  let unblock!: () => void
  const blocked = new Promise<void>((resolve) => {
    unblock = resolve
  })
  let reads = 0
  const writes: CollectionSnapshot[] = []
  const close = vi.fn()
  const { rpc, sqlite } = fixture(t, {
    async request(_id: number, _userId: number, method: string, args: unknown[]) {
      if (method === 'read') {
        if (++reads === 1) await blocked
        return {
          value: {
            snapshot: structuredClone(state),
            episodes: [],
            epStatus: 0,
            volStatus: 0,
          } satisfies RemoteCollection,
        }
      }
      if (method === 'write') {
        state = structuredClone(args[2] as CollectionSnapshot)
        writes.push(state)
        return {}
      }
      throw new Error(`Unexpected network method ${method}`)
    },
    close,
  })
  const repository = new CollectionRepository(sqlite)
  repository.acknowledge(1, 42, 0, { snapshot: state, episodes: [], epStatus: 0, volStatus: 0 })
  await rpc.call('collectionCommand', {
    userId: 1,
    subjectId: 42,
    actionId: 'edit-1',
    kind: 'edit',
    patch: { rate: 9 },
  })
  await rpc.call('collectionActivate', { userId: 1 })
  await rpc.call('collectionSync', { userId: 1 })
  await vi.waitFor(() => expect(reads).toBe(1))
  expect(await rpc.call('collectionRead', { userId: 1, subjectId: 42 })).toMatchObject({ rate: 9 })
  await rpc.call('collectionCommand', {
    userId: 1,
    subjectId: 42,
    actionId: 'edit-2',
    kind: 'edit',
    patch: { rate: 10 },
  })
  unblock()
  await vi.waitFor(
    async () =>
      expect(await rpc.call('collectionOverview', { userId: 1 })).toMatchObject({
        pending: 0,
        running: false,
      }),
    { timeout: 5000 },
  )
  expect(writes.map((write) => write.collection?.rate)).toEqual([9, 10])
  expect(state.collection?.rate).toBe(10)
  expect(reads).toBe(4)
  expect(close).toHaveBeenCalled()
}, 15000)

test('transport error classification survives worker RPC and pauses expired authorization', async (t) => {
  const { rpc } = fixture(t, {
    request() {
      throw new SyncError('需要重新登录', 'auth-required')
    },
    close: vi.fn(),
  })
  await rpc.call('collectionCommand', {
    userId: 1,
    subjectId: 42,
    actionId: 'auth-edit',
    kind: 'edit',
    patch: { rate: 9 },
  })
  await rpc.call('collectionActivate', { userId: 1 })
  await rpc.call('collectionSync', { userId: 1 })
  await vi.waitFor(
    async () =>
      expect(await rpc.call('collectionOverview', { userId: 1 })).toMatchObject({
        authRequired: true,
        running: false,
        errors: [{ subjectId: 42, status: 'auth-required' }],
      }),
    { timeout: 5000 },
  )
  expect(await rpc.call('collectionRead', { userId: 1, subjectId: 42 })).toMatchObject({ rate: 9 })
}, 15000)

test('worker database bridge preserves row shape, atomic batches and durable subject search indexes', async (t) => {
  const { rpc, sqlite } = fixture(t)
  await rpc.call('db', {
    sql: 'create table BridgeTest (id integer primary key, value text)',
    params: [],
    method: 'run',
  })
  await expect(
    rpc.call('dbBatch', {
      queries: [
        { sql: 'insert into BridgeTest values (?, ?)', params: [1, 'rolled back'], method: 'run' },
        { sql: 'insert into MissingTable values (?)', params: [2], method: 'run' },
      ],
    }),
  ).rejects.toThrow('MissingTable')
  expect(
    await rpc.call('db', { sql: 'select * from BridgeTest', params: [], method: 'all' }),
  ).toEqual([])
  await rpc.call('dbBatch', {
    queries: [{ sql: 'insert into BridgeTest values (?, ?)', params: [1, 'saved'], method: 'run' }],
  })
  expect(
    await rpc.call('db', {
      sql: 'select * from BridgeTest where id = ?',
      params: [1],
      method: 'get',
    }),
  ).toEqual([1, 'saved'])
  expect(
    await rpc.call('db', { sql: 'select * from BridgeTest', params: [], method: 'values' }),
  ).toEqual([[1, 'saved']])
  const subject = {
    id: 999999,
    type: 2,
    name: 'Fixture',
    name_cn: '测试动画',
    summary: '',
    platform: '',
    date: null,
    images: { small: '', grid: '', common: '', medium: '', large: '' },
    infobox: [],
    tags: [{ name: 'original', count: 1 }],
    rating: { rank: 1, score: 8, total: 1 },
    ratingCount: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, 0])),
    collection: { wish: 1, collect: 2, doing: 3, on_hold: 0, dropped: 0 },
    total_episodes: 12,
    eps: 12,
    volumes: 0,
    series: false,
    locked: false,
    nsfw: false,
    last_update_at: new Date(),
  } as Subject
  await rpc.call('dbSaveSubjects', [subject])
  expect(
    sqlite.prepare('select name_cn_pinyin from Subject where id = ?').get(subject.id),
  ).toMatchObject({ name_cn_pinyin: expect.stringContaining('ceshidonghua') })
  await rpc.call('dbSaveSubjects', [{ ...subject, tags: [{ name: 'updated', count: 2 }] }])
  expect(
    await rpc.call('db', {
      sql: 'select name, count from SubjectTags where subject_id = ?',
      params: [subject.id],
      method: 'all',
    }),
  ).toEqual([['updated', 2]])
}, 15000)
