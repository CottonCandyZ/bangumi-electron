import assert from 'node:assert/strict'
import { test, type TestContext } from 'node:test'
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
    await assert.rejects(
      retryableNetworkOperation(async () => {
        throw failure
      }, '网络失败'),
      (error: unknown) =>
        error instanceof SyncError && error.kind === 'network' && error.message === '网络失败',
    )
  }
})
test('network operation preserves classified sync errors', async () => {
  const failure = new SyncError('需要登录', 'auth-required')
  await assert.rejects(
    retryableNetworkOperation(async () => {
      throw failure
    }, '网络失败'),
    (error: unknown) => error === failure,
  )
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
  t.after(() => {
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
  assert.deepEqual(result.conflicts, [])
  assert.deepEqual(result.target.collection, {
    type: 3,
    rate: 8,
    tags: ['远端标签'],
    comment: '远端短评',
    private: true,
  })
  assert.deepEqual(result.target.episodes, { 101: 2, 102: 2 })
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
    assert.deepEqual(
      mergeCollection(base, local, remote, new Set([name])).conflicts.map((f) => f.path),
      [name],
    )
  })
}
test('same values and tag reordering do not conflict', () => {
  const base = snapshot(),
    local = snapshot(),
    remote = snapshot()
  local.collection!.tags = ['a', 'b']
  remote.collection!.tags = ['b', 'a']
  assert.equal(mergeCollection(base, local, remote, new Set(['tags'])).conflicts.length, 0)
})
test('same episode changed differently conflicts', () => {
  const base = snapshot(),
    local = snapshot(),
    remote = snapshot()
  local.episodes[101] = 2
  remote.episodes[101] = 3
  assert.equal(
    mergeCollection(base, local, remote, new Set(['episodes.101'])).conflicts[0].path,
    'episodes.101',
  )
})
test('deletion conflicts with remote comment or episode modifications', () => {
  const base = snapshot(),
    local = snapshot(),
    remote = snapshot()
  local.collection = null
  remote.episodes[102] = 2
  assert.equal(
    mergeCollection(base, local, remote, new Set(['collection'])).conflicts[0].path,
    'collection',
  )
})
test('remote deletion conflicts with local episode edits', () => {
  const base = snapshot(),
    local = snapshot(),
    remote = snapshot()
  local.episodes[101] = 2
  remote.collection = null
  assert.equal(
    mergeCollection(base, local, remote, new Set(['episodes.101'])).conflicts[0].path,
    'collection',
  )
})
test('unknown baseline does not overwrite unedited fields with defaults', () => {
  const local = { ...emptySnapshot(), collection: defaultCollection() }
  local.collection.rate = 8
  const remote = snapshot()
  remote.collection!.comment = '远端保留'
  const result = mergeCollection(emptySnapshot(), local, remote, new Set(['collection', 'rate']))
  assert.deepEqual(
    result.conflicts.map((f) => f.path),
    ['rate'],
  )
  assert.equal(result.target.collection!.comment, '远端保留')
})
test('local transaction saves every field before any network write', (t) => {
  const f = fixture(t)
  f.command({
    kind: 'edit',
    patch: { type: 2, rate: 9, tags: ['离线'], comment: '本地短评', private: true },
  })
  assert.equal(f.writes, 0)
  assert.deepEqual(f.repo.collection(1, 42)?.tags, ['离线'])
  assert.equal(f.repo.collection(1, 42)?.comment, '本地短评')
  assert.equal(f.repo.actions(1, 42).length, 1)
  assert.equal(f.repo.get(1, 42)?.base.collection?.rate, 7)
})
test('transaction failure rolls back action and projection together', (t) => {
  const f = fixture(t)
  const put = f.repo.put.bind(f.repo)
  f.repo.put = () => {
    throw new Error('disk failure')
  }
  assert.throws(() => f.command({ kind: 'edit', patch: { rate: 8 } }), /disk failure/)
  f.repo.put = put
  assert.equal(f.repo.actions(1, 42).length, 0)
  assert.equal(f.repo.collection(1, 42)?.rate, 7)
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
  assert.equal(f.repo.actions(1, 42).length, 1)
  assert.throws(() => f.repo.command({ ...command, patch: { rate: 9 } }))
})
test('delete and restore survive restart with tags, comment, rating and episodes', (t) => {
  const f = fixture(t, true)
  f.command({ kind: 'edit', patch: { rate: 9, tags: ['保存'], comment: '保留', private: true } })
  f.command({ kind: 'episodes', episodes: { 101: 2 } })
  f.command({ kind: 'remove' })
  f.reopen()
  assert.equal(f.repo.collection(1, 42), null)
  f.command({ kind: 'edit', patch: { type: 3 } })
  assert.equal(f.repo.collection(1, 42)?.rate, 9)
  assert.deepEqual(f.repo.collection(1, 42)?.tags, ['保存'])
  assert.equal(f.repo.get(1, 42)?.local.episodes[101], 2)
})
test('remove then restore before sending does not replay intermediate operations', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'remove' })
  f.command({ kind: 'edit', patch: { type: 3 } })
  await f.engine().sync(1, 42, f.transport)
  assert.equal(f.writes, 0)
  assert.equal(f.repo.actions(1, 42).length, 0)
})
test('sync merges independent fields and advances the baseline', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  f.state.collection!.tags = ['网页']
  await f.engine().sync(1, 42, f.transport)
  assert.equal(f.state.collection!.rate, 8)
  assert.deepEqual(f.repo.collection(1, 42)?.tags, ['网页'])
  assert.equal(f.repo.get(1, 42)?.status, 'clean')
})
test('new actions during upload are not acknowledged or overwritten', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  f.hook = () => f.command({ kind: 'edit', patch: { rate: 9 } })
  await f.engine().sync(1, 42, f.transport)
  assert.equal(f.repo.collection(1, 42)?.rate, 9)
  assert.equal(f.repo.get(1, 42)?.base.collection?.rate, 8)
  assert.equal(f.repo.actions(1, 42).length, 1)
  f.hook = undefined
  await f.engine().sync(1, 42, f.transport)
  assert.equal(f.state.collection!.rate, 9)
})
test('write success followed by lost response is confirmed without resending after restart', async (t) => {
  const f = fixture(t, true)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  f.hook = () => {
    throw new SyncError('lost response', 'network')
  }
  await assert.rejects(f.engine().sync(1, 42, f.transport))
  f.reopen()
  f.hook = undefined
  await f.engine().sync(1, 42, f.transport)
  assert.equal(f.writes, 1)
  assert.equal(f.repo.actions(1, 42).length, 0)
})
test('partially applied batch and newer edits reconcile after an uncertain response', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8, tags: ['本地'] } })
  f.hook = () => {
    f.state.collection!.tags = ['旧标签']
    throw new SyncError('partial', 'network')
  }
  await assert.rejects(f.engine().sync(1, 42, f.transport))
  f.command({ kind: 'edit', patch: { rate: 9 } })
  f.hook = undefined
  await f.engine().sync(1, 42, f.transport)
  assert.equal(f.state.collection!.rate, 9)
  assert.deepEqual(f.state.collection!.tags, ['本地'])
  assert.equal(f.repo.get(1, 42)?.status, 'clean')
})
test('content conflict preserves both versions and blocks writes', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  f.state.collection!.rate = 9
  await f.engine().sync(1, 42, f.transport)
  assert.equal(f.writes, 0)
  assert.equal(f.repo.get(1, 42)?.conflict?.fields[0].remote, 9)
  assert.equal(f.repo.collection(1, 42)?.rate, 8)
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
  assert.equal(f.writes, 0)
  await engine.sync(1, 42, f.transport)
  assert.equal(f.state.collection!.rate, 8)
  assert.equal(f.state.collection!.comment, '网页')
})
test('stale dialog rejects changed remote or local state', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  f.state.collection!.rate = 9
  const engine = f.engine()
  await engine.sync(1, 42, f.transport)
  const revision = f.repo.get(1, 42)!.revision
  f.state.collection!.rate = 10
  await assert.rejects(
    engine.resolve({ userId: 1, subjectId: 42, revision, choices: { rate: 'local' } }, f.transport),
    /远端状态已改变/,
  )
  f.command({ kind: 'edit', patch: { tags: ['后来'] } })
  await assert.rejects(
    engine.resolve({ userId: 1, subjectId: 42, revision, choices: { rate: 'local' } }, f.transport),
    /本地状态已改变/,
  )
  assert.equal(f.writes, 0)
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
  assert.equal(f.repo.collection(1, 42)?.rate, 8)
  assert.equal(f.repo.collection(2, 42)?.rate, 3)
  assert.equal(f.repo.actions(2, 42).length, 1)
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
  assert.equal(f.repo.get(1, 42)?.status, 'clean')
  assert.equal(f.repo.get(1, 42)?.local.episodes[101], 2)
  assert.equal(snapshotMatches({ ...snapshot(), collection: null }, f.state), true)
})
test('migration adds sync tables without replacing the existing Subject cache', (t) => {
  const f = fixture(t)
  assert.ok(f.db.prepare("SELECT name FROM sqlite_master WHERE name = 'Subject'").get())
  assert.match(
    readFileSync('./drizzle/0006_colorful_mongoose.sql', 'utf8'),
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
  assert.equal(f.state.episodes[101], 2)
  assert.equal(f.state.collection?.rate, 7)
  assert.equal(f.repo.get(1, 42)?.status, 'clean')
})
test('concurrent recreation with different episodes is a lifecycle conflict', () => {
  const base = { ...snapshot(), collection: null }
  const local = snapshot(),
    remote = snapshot()
  local.episodes[101] = 2
  const plan = mergeCollection(base, local, remote, new Set(['collection']))
  assert.equal(plan.conflicts[0]?.path, 'collection')
})
test('offline add then remove does not delete a new remote collection', () => {
  const base = { ...snapshot(), collection: null }
  const plan = mergeCollection(base, base, snapshot(), new Set(['collection']))
  assert.equal(plan.conflicts.length, 0)
  assert.deepEqual(plan.target, snapshot())
})
test('list refresh cannot overwrite a dirty baseline or local metadata', (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8, tags: ['本地'] } })
  f.repo.seed(1, { ...f.repo.collection(1, 42)!, rate: 10, tags: ['网页'] })
  assert.equal(f.repo.get(1, 42)?.base.collection?.rate, 7)
  assert.equal(f.repo.collection(1, 42)?.rate, 8)
  assert.deepEqual(f.repo.collection(1, 42)?.tags, ['本地'])
})
test('actions made during the first remote read survive its acknowledgement', async (t) => {
  const f = fixture(t)
  f.transport.read = async () => {
    f.command({ kind: 'edit', patch: { comment: '拉取期间的编辑' } })
    f.transport.read = async () => f.remote()
    return f.remote()
  }
  await f.engine().sync(1, 42, f.transport)
  assert.equal(f.repo.collection(1, 42)?.comment, '拉取期间的编辑')
  assert.equal(f.repo.actions(1, 42).length, 1)
})
test('local derived progress matches the server count of all marked episodes', (t) => {
  const f = fixture(t)
  f.command({ kind: 'episodes', episodes: { 101: 1, 102: 3 } })
  assert.equal(f.repo.collection(1, 42)?.ep_status, 2)
  f.command({ kind: 'episodes', episodes: { 101: 2 } })
  assert.equal(f.repo.collection(1, 42)?.ep_status, 2)
  f.command({ kind: 'episodes', episodes: { 102: 0 } })
  assert.equal(f.repo.collection(1, 42)?.ep_status, 1)
})
test('upgrade normalizes legacy token timestamps without hiding a newer token', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'bangumi-session-migration-'))
  const sqlite = new Database(':memory:')
  t.after(() => {
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
  assert.deepEqual(rows, [
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
  assert.ok(Math.abs(generated.create_time - Date.now()) < 2000)
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
  assert.deepEqual(events, ['reading', 'read', 'uploading', 'write', 'verifying', 'read'])
  assert.equal(f.repo.get(1, 42)?.status, 'clean')
})

test('read-only sync and conflicts never report an upload', async (t) => {
  const f = fixture(t)
  const phases: string[] = []
  await f.engine().sync(1, 42, f.transport, (phase) => phases.push(phase))
  assert.deepEqual(phases, ['reading'])
  phases.length = 0
  f.command({ kind: 'edit', patch: { rate: 8 } })
  f.state.collection!.rate = 9
  await f.engine().sync(1, 42, f.transport, (phase) => phases.push(phase))
  assert.deepEqual(phases, ['reading'])
  assert.equal(f.repo.get(1, 42)?.status, 'conflict')
  assert.equal(f.writes, 0)
})

test('failed uploads remain visible as unfinished results, not successes', async (t) => {
  const f = fixture(t)
  f.command({ kind: 'edit', patch: { rate: 8 } })
  const progress = new CollectionSyncProgress(() => {})
  progress.stage('changes', 1)
  const phases: string[] = []
  await assert.rejects(
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
  )
  progress.settled(f.repo.get(1, 42)!, true)
  progress.finish()
  assert.deepEqual(phases, ['reading', 'uploading'])
  assert.equal(progress.value.completed, 1)
  assert.equal(progress.value.current, null)
  assert.equal(progress.value.recent[0].status, 'error')
  assert.equal(progress.value.recent[0].error, '连接中断')
  assert.ok(progress.value.finishedAt)
})

test('progress counts are stage-specific and keep conflicts and newer edits distinct', (t) => {
  const f = fixture(t)
  const progress = new CollectionSyncProgress(() => {})
  progress.stage('list', null)
  assert.equal(progress.value.total, null)
  progress.downloaded(100, 785)
  assert.equal(progress.value.completed, 100)
  progress.stage('episodes', 3)
  assert.equal(progress.value.completed, 0)
  assert.equal(progress.value.total, 3)
  const record = f.repo.get(1, 42)!
  progress.subject(record, 'reading')
  assert.equal(progress.value.current?.subject.id, 42)
  progress.settled(record, false)
  assert.equal(progress.value.recent[0].status, 'synced')
  progress.settled({ ...record, subjectId: 43, status: 'conflict' }, false)
  progress.settled({ ...record, subjectId: 44, status: 'pending' }, false)
  assert.equal(progress.value.completed, 3)
  assert.deepEqual(
    progress.value.recent.map((item) => item.status),
    ['pending', 'conflict', 'synced'],
  )
  const nextAccount = new CollectionSyncProgress(() => {})
  assert.deepEqual(nextAccount.value.recent, [])
  assert.equal(nextAccount.value.current, null)
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
  assert.equal(collectionSyncIndicator(overview).badge, 61)
  assert.match(collectionSyncIndicator(overview).title, /剩余 61 项/)
  overview.progress!.completed = 162
  assert.equal(collectionSyncIndicator(overview).badge, null)
  overview.running = false
  assert.equal(collectionSyncIndicator(overview).badge, null)
  overview.error = '连接中断'
  assert.equal(collectionSyncIndicator(overview).badge, '!')
  overview.error = null
  overview.pending = 2
  assert.equal(collectionSyncIndicator(overview).badge, 2)
  overview.running = true
  overview.progress!.total = null
  assert.equal(collectionSyncIndicator(overview).badge, null)
  assert.equal(collectionSyncIndicator(overview).title, '正在同步收藏')
})
