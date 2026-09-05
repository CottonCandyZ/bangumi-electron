import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CollectionRepository } from '../../src/main/collection/repository'
import { defaultCollection } from '../../src/shared/collection-sync'
import {
  subject,
  subjectRate,
  subjectRatingCount,
  subjectCollection,
} from '../../src/db/schema/subject'
const directory = process.argv[2]
if (!directory) throw new Error('Pass a dedicated temporary user data directory')
if (existsSync(join(directory, 'store.sqlite')))
  throw new Error('Refusing to overwrite an existing database')
mkdirSync(directory, { recursive: true })
const sqlite = new Database(join(directory, 'store.sqlite'))
const db = drizzle(sqlite)
migrate(db, { migrationsFolder: './drizzle' })
const repo = new CollectionRepository(sqlite)
repo.saveAccount({
  id: 999999991,
  username: 'offline-test',
  nickname: '离线测试账号',
  avatar: { small: '', medium: '', large: '' },
  sign: '',
  user_group: 10,
  url: '',
  time_offset: 8,
})
const images = { small: '', grid: '', medium: '', large: '', common: '' }
db.insert(subject)
  .values({
    id: 999999990,
    date: null,
    platform: 'TV',
    name: 'Offline sync fixture',
    name_cn: '同步验收条目',
    summary: '本地测试数据',
    images,
    total_episodes: 3,
    eps: 3,
    volumes: 0,
    infobox: [],
    series: false,
    locked: false,
    nsfw: false,
    type: 2,
    last_update_at: new Date(),
  })
  .onConflictDoNothing()
  .run()
db.insert(subjectRate)
  .values({ subject_id: 999999990, total: 0, score: 0, rank: 0 })
  .onConflictDoNothing()
  .run()
db.insert(subjectRatingCount)
  .values({
    subject_id: 999999990,
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    '6': 0,
    '7': 0,
    '8': 0,
    '9': 0,
    '10': 0,
  })
  .onConflictDoNothing()
  .run()
db.insert(subjectCollection)
  .values({ subject_id: 999999990, on_hold: 0, dropped: 0, wish: 0, collect: 0, doing: 0 })
  .onConflictDoNothing()
  .run()
repo.ensure(999999991, 999999990)
repo.acknowledge(999999991, 999999990, 0, {
  snapshot: {
    collection: { ...defaultCollection(), rate: 7, comment: '离线前的短评', tags: ['测试标签'] },
    episodes: { 999999981: 0, 999999982: 0, 999999983: 0 },
    episodesComplete: true,
  },
  episodes: [1, 2, 3].map((sort) => ({
    id: 999999980 + sort,
    subject_id: 999999990,
    type: 0,
    sort,
    ep: sort,
    name: `Episode ${sort}`,
    name_cn: `第 ${sort} 集`,
    airdate: '2020-01-01',
    duration: '',
    desc: '',
    comment: 0,
    disc: 0,
    duration_seconds: 0,
  })),
  epStatus: 0,
  volStatus: 0,
})
repo.completeList(999999991)
sqlite.close()
// Run in the isolated renderer after startup: Jotai stores the account ID as a JSON string.
const activation = join(directory, 'activate-offline-fixture.js')
writeFileSync(
  activation,
  `if (!['localhost', '127.0.0.1'].includes(location.hostname)) throw new Error('Use the isolated development renderer');
localStorage.setItem('current_user_id', JSON.stringify('999999991'));
location.reload();
`,
)
console.log(directory)
console.log(
  `Activate the fixture account through CDP using ${activation}; see docs/local-sync-design.md.`,
)
