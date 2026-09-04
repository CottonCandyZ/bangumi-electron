import { expect, test, type TestContext } from 'vitest'
import { readFileSync, mkdtempSync, rmSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { collectionSyncIndicator } from '../../src/renderer/src/modules/common/collections/sync-indicator'
import type { SyncOverview } from '../../src/shared/collection-sync'
import { CollectionSyncProgress } from '../../src/main/collection/progress'
import { CollectionRepository } from '../../src/main/collection/repository'
import {
  CollectionSyncEngine,
  retryableNetworkOperation,
  SyncError,
  type CollectionTransport,
} from '../../src/main/collection/sync'
import {
  defaultCollection,
  emptySnapshot,
  mergeCollection,
  snapshotMatches,
  type CollectionCommand,
  type CollectionSnapshot,
  type RemoteCollection,
} from '../../src/shared/collection-sync'

const snapshot = (): CollectionSnapshot => ({
  collection: { ...defaultCollection(), rate: 7, tags: ['旧标签'] },
  episodes: { 101: 0, 102: 0 },
  episodesComplete: true,
})
test('network operation classifies request and response-body failures as retryable', async () => {
  for (const failure of [new TypeError('fetch failed'), new Error('response body aborted')]) {
    await expect(
      retryableNetworkOperation(async () => {
        throw failure
      }, '网络失败'),
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof SyncError && error.kind === 'network' && error.message === '网络失败',
    )
  }
})
test('network operation preserves classified sync errors', async () => {
  const failure = new SyncError('需要登录', 'auth-required')
  await expect(
    retryableNetworkOperation(async () => {
      throw failure
    }, '网络失败'),
  ).rejects.toSatisfy((error: unknown) => error === failure)
})
function fixture(t: TestContext, disk = false) {
  const directory = mkdtempSync(join(tmpdir(), 'bangumi-sync-test-'))
  const filename = disk ? join(directory, 'test.sqlite') : ':memory:'
  let sqlite = new Database(filename)
  migrate(drizzle(sqlite), { migrationsFolder: './drizzle' })
  let repository = new CollectionRepository(sqlite)
  let state = snapshot()
  let writes = 0
  let writeHook: (() => void) | undefined
  const remote = (): RemoteCollection => ({
    snapshot: structuredClone(state),
    episodes: [],
    epStatus: Object.values(state.episodes).filter((s) => s !== 0).length,
    volStatus: 0,
  })
  const transport: CollectionTransport = {
    read: async () => remote(),
    write: async (_id, _before, target) => {
      writes++
      state = structuredClone(target)
      writeHook?.()
    },
    list: async () => ({ data: [], total: 0, limit: 100 }),
  }
  repository.ensure(1, 42)
  repository.acknowledge(1, 42, 0, remote())
  t.onTestFinished(() => {
    sqlite.close()
    rmSync(directory, { recursive: true, force: true })
  })
  return {
    get repo() {
      return repository
    },
    get db() {
      return sqlite
    },
    get state() {
      return state
    },
    set state(value) {
      state = value
    },
    get writes() {
      return writes
    },
    transport,
    remote,
    set hook(value: (() => void) | undefined) {
      writeHook = value
    },
    engine: () => new CollectionSyncEngine(repository),
    command: (
      command:
        | Omit<Extract<CollectionCommand, { kind: 'edit' }>, 'userId' | 'subjectId' | 'actionId'>
        | Omit<Extract<CollectionCommand, { kind: 'remove' }>, 'userId' | 'subjectId' | 'actionId'>
        | Omit<
            Extract<CollectionCommand, { kind: 'episodes' }>,
            'userId' | 'subjectId' | 'actionId'
          >,
    ) => repository.command({ ...command, userId: 1, subjectId: 42, actionId: randomUUID() }),
    reopen: () => {
      sqlite.close()
      sqlite = new Database(filename)
      repository = new CollectionRepository(sqlite)
    },
  }
}
test('merge disjoint rating, comment, tags, privacy and episode changes', () => {
  const base = snapshot(),
    local = snapshot(),
    remote = snapshot()
  local.collection!.rate = 8
  local.collection!.private = true
  local.episodes[101] = 2
  remote.collection!.tags = ['远端标签']
  remote.collection!.comment = '远端短评'
  remote.episodes[102] = 2
  const result = mergeCollection(base, local, remote, new Set(['rate', 'private', 'episodes.101']))
  expect(result.conflicts).toEqual([])
  expect(result.target.collection).toEqual({
    type: 3,
    rate: 8,
    tags: ['远端标签'],
    comment: '远端短评',
    private: true,
  })
  expect(result.target.episodes).toEqual({ 101: 2, 102: 2 })
})
for (const [name, l, r] of [
  ['rate', 8, 9],
  ['comment', '本地', '远端'],
  ['tags', ['本地'], ['远端']],
  ['type', 2, 5],
] as const) {
  test(`conflicting ${name} requires a decision`, () => {
    const base = snapshot(),
      local = snapshot(),
      remote = snapshot()
    Object.assign(local.collection!, { [name]: l })
    Object.assign(remote.collection!, { [name]: r })
    expect(
      mergeCollection(base, local, remote, new Set([name])).conflicts.map((f) => f.path),
    ).toEqual([name])
  })
}
test('same values and tag reordering do not conflict', () => {
  const base = snapshot(),
    local = snapshot(),
    remote = snapshot()
  local.collection!.tags = ['a', 'b']
  remote.collection!.tags = ['b', 'a']
  expect(mergeCollection(base, local, remote, new Set(['tags'])).conflicts.length).toBe(0)
})
test('same episode changed differently conflicts', () => {
  const base = snapshot(),
    local = snapshot(),
    remote = snapshot()
  local.episodes[101] = 2
  remote.episodes[101] = 3
  expect(mergeCollection(base, local, remote, new Set(['episodes.101'])).conflicts[0].path).toBe(
    'episodes.101',
  )
})
test('deletion conflicts with remote comment or episode modifications', () => {
  const base = snapshot(),
    local = snapshot(),
    remote = snapshot()
  local.collection = null
  remote.episodes[102] = 2
  expect(mergeCollection(base, local, remote, new Set(['collection'])).conflicts[0].path).toBe(
    'collection',
  )
})
test('remote deletion conflicts with local episode edits', () => {
  const base = snapshot(),
    local = snapshot(),
    remote = snapshot()
  local.episodes[101] = 2
  remote.collection = null
  expect(mergeCollection(base, local, remote, new Set(['episodes.101'])).conflicts[0].path).toBe(
    'collection',
  )
})
test('unknown baseline does not overwrite unedited fields with defaults', () => {
  const local = { ...emptySnapshot(), collection: defaultCollection() }
  local.collection.rate = 8
  const remote = snapshot()
  remote.collection!.comment = '远端保留'
  const result = mergeCollection(emptySnapshot(), local, remote, new Set(['collection', 'rate']))
  expect(result.conflicts.map((f) => f.path)).toEqual(['rate'])
  expect(result.target.collection!.comment).toBe('远端保留')
})
test('local transaction saves every field before any network write', (t) => {
  const f = fixture(t)
  f.command({
    kind: 'edit',
    patch: { type: 2, rate: 9, tags: ['离线'], comment: '本地短评', private: true },
  })
  expect(f.writes).toBe(0)
  expect(f.repo.collection(1, 42)?.tags).toEqual(['离线'])
  expect(f.repo.collection(1, 42)?.comment).toBe('本地短评')
  expect(f.repo.actions(1, 42).length).toBe(1)
  expect(f.repo.get(1, 42)?.base.collection?.rate).toBe(7)
})
test('transaction failure rolls back action and projection together', (t) => {
  const f = fixture(t)
  const put = f.repo.put.bind(f.repo)
  f.repo.put = () => {
    throw new Error('disk failure')
  }
  expect(() => f.command({ kind: 'edit', patch: { rate: 8 } })).toThrow(/disk failure/)
  f.repo.put = put
  expect(f.repo.actions(1, 42).length).toBe(0)
  expect(f.repo.collection(1, 42)?.rate).toBe(7)
})
test('action IDs deduplicate IPC retries and reject reuse', (t) => {
  const f = fixture(t)
  const command: CollectionCommand = {
    kind: 'edit',
    patch: { rate: 8 },
    userId: 1,
    subjectId: 42,
    actionId: 'same',
  }
  f.repo.command(command)
  f.repo.command(command)
  expect(f.repo.actions(1, 42).length).toBe(1)
  expect(() => f.repo.command({ ...command, patch: { rate: 9 } })).toThrow()
})
test('delete and restore survive restart with tags, comment, rating and episodes', (t) => {
  const f = fixture(t, true)
  f.command({ kind: 'edit', patch: { rate: 9, tags: ['保存'], comment: '保留', private: true } })
  f.command({ kind: 'episodes', episodes: { 101: 2 } })
  f.command({ kind: 'remove' })
  f.reopen()
  expect(f.repo.collection(1, 42)).toBe(null)
  f.command({ kind: 'edit', patch: { type: 3 } })
  expect(f.repo.collection(1, 42)?.rate).toBe(9)
  expect(f.repo.collection(1, 42)?.tags).toEqual(['保存'])
  expect(f.repo.get(1, 42)?.local.episodes[101]).toBe(2)
})
test('remove then restore before sending does not replay intermediate operations', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'remove' })
  f.command({ kind: 'edit', patch: { type: 3 } })
  await f.engine().sync(1, 42, f.transport)
  expect(f.writes).toBe(0)
  expect(f.repo.actions(1, 42).length).toBe(0)
})
test('sync merges independent fields and advances the baseline', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  f.state.collection!.tags = ['网页']
  await f.engine().sync(1, 42, f.transport)
  expect(f.state.collection!.rate).toBe(8)
  expect(f.repo.collection(1, 42)?.tags).toEqual(['网页'])
  expect(f.repo.get(1, 42)?.status).toBe('clean')
})
test('new actions during upload are not acknowledged or overwritten', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  f.hook = () => f.command({ kind: 'edit', patch: { rate: 9 } })
  await f.engine().sync(1, 42, f.transport)
  expect(f.repo.collection(1, 42)?.rate).toBe(9)
  expect(f.repo.get(1, 42)?.base.collection?.rate).toBe(8)
  expect(f.repo.actions(1, 42).length).toBe(1)
  f.hook = undefined
  await f.engine().sync(1, 42, f.transport)
  expect(f.state.collection!.rate).toBe(9)
})
test('write success followed by lost response is confirmed without resending after restart', async (t) => {
  const f = fixture(t, true)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  f.hook = () => {
    throw new SyncError('lost response', 'network')
  }
  await expect(f.engine().sync(1, 42, f.transport)).rejects.toThrow()
  f.reopen()
  f.hook = undefined
  await f.engine().sync(1, 42, f.transport)
  expect(f.writes).toBe(1)
  expect(f.repo.actions(1, 42).length).toBe(0)
})
test('partially applied batch and newer edits reconcile after an uncertain response', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8, tags: ['本地'] } })
  f.hook = () => {
    f.state.collection!.tags = ['旧标签']
    throw new SyncError('partial', 'network')
  }
  await expect(f.engine().sync(1, 42, f.transport)).rejects.toThrow()
  f.command({ kind: 'edit', patch: { rate: 9 } })
  f.hook = undefined
  await f.engine().sync(1, 42, f.transport)
  expect(f.state.collection!.rate).toBe(9)
  expect(f.state.collection!.tags).toEqual(['本地'])
  expect(f.repo.get(1, 42)?.status).toBe('clean')
})
test('content conflict preserves both versions and blocks writes', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  f.state.collection!.rate = 9
  await f.engine().sync(1, 42, f.transport)
  expect(f.writes).toBe(0)
  expect(f.repo.get(1, 42)?.conflict?.fields[0].remote).toBe(9)
  expect(f.repo.collection(1, 42)?.rate).toBe(8)
})
test('conflict resolution is durable, per field and verified again', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8, comment: '本地' } })
  f.state.collection!.rate = 9
  f.state.collection!.comment = '网页'
  const engine = f.engine()
  await engine.sync(1, 42, f.transport)
  await engine.resolve(
    {
      userId: 1,
      subjectId: 42,
      revision: f.repo.get(1, 42)!.revision,
      choices: { rate: 'local', comment: 'remote' },
    },
    f.transport,
  )
  expect(f.writes).toBe(0)
  await engine.sync(1, 42, f.transport)
  expect(f.state.collection!.rate).toBe(8)
  expect(f.state.collection!.comment).toBe('网页')
})
test('stale dialog rejects changed remote or local state', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  f.state.collection!.rate = 9
  const engine = f.engine()
  await engine.sync(1, 42, f.transport)
  const revision = f.repo.get(1, 42)!.revision
  f.state.collection!.rate = 10
  await expect(
    engine.resolve({ userId: 1, subjectId: 42, revision, choices: { rate: 'local' } }, f.transport),
  ).rejects.toThrow(/远端状态已改变/)
  f.command({ kind: 'edit', patch: { tags: ['后来'] } })
  await expect(
    engine.resolve({ userId: 1, subjectId: 42, revision, choices: { rate: 'local' } }, f.transport),
  ).rejects.toThrow(/本地状态已改变/)
  expect(f.writes).toBe(0)
})
test('accounts never share collection projections or actions', (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  f.repo.command({
    userId: 2,
    subjectId: 42,
    actionId: randomUUID(),
    kind: 'edit',
    patch: { rate: 3 },
  })
  expect(f.repo.collection(1, 42)?.rate).toBe(8)
  expect(f.repo.collection(2, 42)?.rate).toBe(3)
  expect(f.repo.actions(2, 42).length).toBe(1)
})
test('confirmed deletion ignores server-cleared episode state but retains local backup', async (t) => {
  const f = fixture(t)
  f.state.episodes[101] = 2
  f.repo.acknowledge(1, 42, 0, f.remote())
  f.command({ kind: 'remove' })
  f.hook = () => {
    f.state.episodes[101] = 0
  }
  await f.engine().sync(1, 42, f.transport)
  expect(f.repo.get(1, 42)?.status).toBe('clean')
  expect(f.repo.get(1, 42)?.local.episodes[101]).toBe(2)
  expect(snapshotMatches({ ...snapshot(), collection: null }, f.state)).toBe(true)
})
test('migration adds sync tables without replacing the existing Subject cache', (t) => {
  const f = fixture(t)
  expect(f.db.prepare("SELECT name FROM sqlite_master WHERE name = 'Subject'").get()).toBeTruthy()
  expect(readFileSync('./drizzle/0006_colorful_mongoose.sql', 'utf8')).toMatch(
    /CREATE TABLE `LocalCollection`/,
  )
})
test('restore after confirmed deletion restores episodes omitted by the server', async (t) => {
  const f = fixture(t)
  f.state.episodes[101] = 2
  f.repo.acknowledge(1, 42, 0, f.remote())
  f.command({ kind: 'remove' })
  f.hook = () => {
    f.state.episodes = {}
  }
  await f.engine().sync(1, 42, f.transport)
  f.hook = undefined
  f.command({ kind: 'edit', patch: { type: 3 } })
  await f.engine().sync(1, 42, f.transport)
  expect(f.state.episodes[101]).toBe(2)
  expect(f.state.collection?.rate).toBe(7)
  expect(f.repo.get(1, 42)?.status).toBe('clean')
})
test('concurrent recreation with different episodes is a lifecycle conflict', () => {
  const base = { ...snapshot(), collection: null }
  const local = snapshot(),
    remote = snapshot()
  local.episodes[101] = 2
  const plan = mergeCollection(base, local, remote, new Set(['collection']))
  expect(plan.conflicts[0]?.path).toBe('collection')
})
test('offline add then remove does not delete a new remote collection', () => {
  const base = { ...snapshot(), collection: null }
  const plan = mergeCollection(base, base, snapshot(), new Set(['collection']))
  expect(plan.conflicts.length).toBe(0)
  expect(plan.target).toEqual(snapshot())
})
test('list refresh cannot overwrite a dirty baseline or local metadata', (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8, tags: ['本地'] } })
  f.repo.seed(1, { ...f.repo.collection(1, 42)!, rate: 10, tags: ['网页'] })
  expect(f.repo.get(1, 42)?.base.collection?.rate).toBe(7)
  expect(f.repo.collection(1, 42)?.rate).toBe(8)
  expect(f.repo.collection(1, 42)?.tags).toEqual(['本地'])
})
test('actions made during the first remote read survive its acknowledgement', async (t) => {
  const f = fixture(t)
  f.transport.read = async () => {
    f.command({ kind: 'edit', patch: { comment: '拉取期间的编辑' } })
    f.transport.read = async () => f.remote()
    return f.remote()
  }
  await f.engine().sync(1, 42, f.transport)
  expect(f.repo.collection(1, 42)?.comment).toBe('拉取期间的编辑')
  expect(f.repo.actions(1, 42).length).toBe(1)
})
test('local derived progress matches the server count of all marked episodes', (t) => {
  const f = fixture(t)
  f.command({ kind: 'episodes', episodes: { 101: 1, 102: 3 } })
  expect(f.repo.collection(1, 42)?.ep_status).toBe(2)
  f.command({ kind: 'episodes', episodes: { 101: 2 } })
  expect(f.repo.collection(1, 42)?.ep_status).toBe(2)
  f.command({ kind: 'episodes', episodes: { 102: 0 } })
  expect(f.repo.collection(1, 42)?.ep_status).toBe(1)
})
test('upgrade normalizes legacy token timestamps without hiding a newer token', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'bangumi-session-migration-'))
  const sqlite = new Database(':memory:')
  t.onTestFinished(() => {
    sqlite.close()
    rmSync(directory, { recursive: true, force: true })
  })
  const journal = JSON.parse(readFileSync('./drizzle/meta/_journal.json', 'utf8'))
  journal.entries = journal.entries.filter((entry: { idx: number }) => entry.idx < 7)
  mkdirSync(join(directory, 'meta'))
  writeFileSync(join(directory, 'meta/_journal.json'), JSON.stringify(journal))
  for (const entry of journal.entries)
    copyFileSync(`./drizzle/${entry.tag}.sql`, join(directory, `${entry.tag}.sql`))
  migrate(drizzle(sqlite), { migrationsFolder: directory })
  const insert = sqlite.prepare(
    'INSERT INTO UserSession (user_id, access_token, refresh_token, expires_in, create_time) VALUES (1, ?, ?, 3600, ?)',
  )
  insert.run('old', 'old-refresh', '2025-01-01 00:00:00')
  const fresh = Date.parse('2026-01-01T00:00:00Z')
  insert.run('new', 'new-refresh', fresh)
  migrate(drizzle(sqlite), { migrationsFolder: './drizzle' })
  const rows = sqlite
    .prepare('SELECT access_token, create_time FROM UserSession ORDER BY create_time DESC')
    .all()
  expect(rows).toEqual([
    { access_token: 'new', create_time: fresh },
    { access_token: 'old', create_time: Date.parse('2025-01-01T00:00:00Z') },
  ])
  sqlite
    .prepare(
      "INSERT INTO UserSession (user_id, access_token, refresh_token, expires_in) VALUES (2, 'default', 'default-refresh', 3600)",
    )
    .run()
  const generated = sqlite
    .prepare('SELECT create_time FROM UserSession WHERE user_id = 2')
    .get() as { create_time: number }
  expect(Math.abs(generated.create_time - Date.now()) < 2000).toBeTruthy()
})

test('sync progress reports the actual read, upload and verification boundaries', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  const events: string[] = []
  await f.engine().sync(
    1,
    42,
    {
      ...f.transport,
      read: async (id) => {
        events.push('read')
        return f.transport.read(id)
      },
      write: async (...args) => {
        events.push('write')
        return f.transport.write(...args)
      },
    },
    (phase) => events.push(phase),
  )
  expect(events).toEqual(['reading', 'read', 'uploading', 'write', 'verifying', 'read'])
  expect(f.repo.get(1, 42)?.status).toBe('clean')
})

test('read-only sync and conflicts never report an upload', async (t) => {
  const f = fixture(t)
  const phases: string[] = []
  await f.engine().sync(1, 42, f.transport, (phase) => phases.push(phase))
  expect(phases).toEqual(['reading'])
  phases.length = 0
  f.command({ kind: 'edit', patch: { rate: 8 } })
  f.state.collection!.rate = 9
  await f.engine().sync(1, 42, f.transport, (phase) => phases.push(phase))
  expect(phases).toEqual(['reading'])
  expect(f.repo.get(1, 42)?.status).toBe('conflict')
  expect(f.writes).toBe(0)
})

test('failed uploads remain visible as unfinished results, not successes', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  const progress = new CollectionSyncProgress(() => {})
  progress.stage('changes', 1)
  const phases: string[] = []
  await expect(
    f.engine().sync(
      1,
      42,
      {
        ...f.transport,
        write: async () => {
          throw new SyncError('连接中断', 'network')
        },
      },
      (phase) => {
        phases.push(phase)
        progress.subject(f.repo.get(1, 42)!, phase)
      },
    ),
  ).rejects.toThrow()
  progress.settled(f.repo.get(1, 42)!, true)
  progress.finish()
  expect(phases).toEqual(['reading', 'uploading'])
  expect(progress.value.completed).toBe(1)
  expect(progress.value.current).toBe(null)
  expect(progress.value.recent[0].status).toBe('error')
  expect(progress.value.recent[0].error).toBe('连接中断')
  expect(progress.value.finishedAt).toBeTruthy()
})

test('progress counts are stage-specific and keep conflicts and newer edits distinct', (t) => {
  const f = fixture(t)
  const progress = new CollectionSyncProgress(() => {})
  progress.stage('list', null)
  expect(progress.value.total).toBe(null)
  progress.downloaded(100, 785)
  expect(progress.value.completed).toBe(100)
  progress.stage('episodes', 3)
  expect(progress.value.completed).toBe(0)
  expect(progress.value.total).toBe(3)
  const record = f.repo.get(1, 42)!
  progress.subject(record, 'reading')
  expect(progress.value.current?.subject.id).toBe(42)
  progress.settled(record, false)
  expect(progress.value.recent[0].status).toBe('synced')
  progress.settled({ ...record, subjectId: 43, status: 'conflict' }, false)
  progress.settled({ ...record, subjectId: 44, status: 'pending' }, false)
  expect(progress.value.completed).toBe(3)
  expect(progress.value.recent.map((item) => item.status)).toEqual([
    'pending',
    'conflict',
    'synced',
  ])
  const nextAccount = new CollectionSyncProgress(() => {})
  expect(nextAccount.value.recent).toEqual([])
  expect(nextAccount.value.current).toBe(null)
})

test('sidebar counts remaining stage work and restores attention after completion', () => {
  const overview: SyncOverview = {
    authRequired: false,
    pending: 0,
    conflicts: [],
    errors: [],
    running: true,
    lastSyncedAt: null,
    listComplete: true,
    error: null,
    progress: {
      stage: 'episodes',
      total: 162,
      completed: 101,
      current: null,
      recent: [],
      finishedAt: null,
    },
  }
  expect(collectionSyncIndicator(overview).badge).toBe(61)
  expect(collectionSyncIndicator(overview).title).toMatch(/剩余 61 项/)
  overview.progress!.completed = 162
  expect(collectionSyncIndicator(overview).badge).toBe(null)
  overview.running = false
  expect(collectionSyncIndicator(overview).badge).toBe(null)
  overview.error = '连接中断'
  expect(collectionSyncIndicator(overview).badge).toBe('!')
  overview.error = null
  overview.pending = 2
  expect(collectionSyncIndicator(overview).badge).toBe(2)
  overview.running = true
  overview.progress!.total = null
  expect(collectionSyncIndicator(overview).badge).toBe(null)
  expect(collectionSyncIndicator(overview).title).toBe('正在同步收藏')
})

test('new unmarked episodes do not turn offline removal into a lifecycle conflict', () => {
  const base = snapshot(),
    local = snapshot(),
    remote = snapshot()
  local.collection = null
  remote.episodes[103] = 0
  const plan = mergeCollection(base, local, remote, new Set(['collection']))
  expect(plan.conflicts).toEqual([])
  expect(plan.target.collection).toBe(null)
  remote.episodes[103] = 2
  expect(mergeCollection(base, local, remote, new Set(['collection'])).conflicts[0]?.path).toBe(
    'collection',
  )
})

test('recent removals exclude never-collected reads and retain actual removals', (t) => {
  const f = fixture(t)
  f.repo.ensure(1, 99)
  f.repo.acknowledge(1, 99, 0, {
    snapshot: { collection: null, episodes: {}, episodesComplete: true },
    episodes: [],
    epStatus: 0,
    volStatus: 0,
  })
  expect(f.repo.removed(1)).toEqual([])
  f.command({ kind: 'remove' })
  expect(f.repo.removed(1).map((r) => r.subjectId)).toEqual([42])
  expect(f.repo.removed(2)).toEqual([])
})

test('choosing remote deletion discards rejected episode edits when restored', async (t) => {
  const f = fixture(t, true)
  f.command({ kind: 'episodes', episodes: { 101: 2 } })
  f.state = { collection: null, episodes: {}, episodesComplete: true }
  await f.engine().sync(1, 42, f.transport)
  const record = f.repo.get(1, 42)!
  expect(record.status).toBe('conflict')
  await f
    .engine()
    .resolve(
      { userId: 1, subjectId: 42, revision: record.revision, choices: { collection: 'remote' } },
      f.transport,
    )
  f.reopen()
  expect(f.repo.get(1, 42)?.local.episodes).toEqual({})
  await f.engine().sync(1, 42, f.transport)
  f.command({ kind: 'edit', patch: { type: 3 } })
  await f.engine().sync(1, 42, f.transport)
  expect(f.state.collection?.type).toBe(3)
  expect(f.state.episodes).toEqual({})
})

test('an aborted first read keeps durable edits pending for reactivation', async (t) => {
  const f = fixture(t, true)
  f.command({ kind: 'edit', patch: { rate: 9 } })
  const read = f.transport.read
  f.transport.read = async () => {
    throw new DOMException('account switched', 'AbortError')
  }
  await expect(f.engine().sync(1, 42, f.transport)).rejects.toThrow('account switched')
  f.reopen()
  expect(f.repo.get(1, 42)?.status).toBe('pending')
  expect(f.repo.get(1, 42)?.error).toBe(null)
  expect(f.repo.actions(1, 42)).toHaveLength(1)
  f.transport.read = read
  await f.engine().sync(1, 42, f.transport)
  expect(f.state.collection?.rate).toBe(9)
  expect(f.repo.get(1, 42)?.status).toBe('clean')
})

for (const mode of ['confirmed', 'uncertain'])
  test(`choosing local removal preserves the backup after ${mode} deletion`, async (t) => {
    const f = fixture(t, true)
    f.command({ kind: 'edit', patch: { rate: 9, tags: ['local'] } })
    f.command({ kind: 'episodes', episodes: { 101: 2 } })
    f.command({ kind: 'remove' })
    f.state.collection!.rate = 4
    f.state.episodes[102] = 3
    await f.engine().sync(1, 42, f.transport)
    const record = f.repo.get(1, 42)!
    await f
      .engine()
      .resolve(
        { userId: 1, subjectId: 42, revision: record.revision, choices: { collection: 'local' } },
        f.transport,
      )
    f.reopen()
    expect(f.repo.get(1, 42)?.retained?.rate).toBe(9)
    expect(f.repo.get(1, 42)?.local.episodes).toEqual({ 101: 2, 102: 0 })
    if (mode === 'uncertain') {
      const write = f.transport.write
      f.transport.write = async () => {
        f.transport.write = write
        throw new SyncError('response lost', 'network')
      }
      await expect(f.engine().sync(1, 42, f.transport)).rejects.toThrow('response lost')
    } else await f.engine().sync(1, 42, f.transport)
    f.command({ kind: 'edit', patch: { type: 3 } })
    await f.engine().sync(1, 42, f.transport)
    expect(f.state.collection?.rate).toBe(9)
    expect(f.state.collection?.tags).toEqual(['local'])
    expect(f.state.episodes).toEqual({ 101: 2, 102: 0 })
  })
