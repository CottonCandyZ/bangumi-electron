import { resolve } from 'node:path'
import { JSONFileSyncPreset } from 'lowdb/node'
import { appPath } from '@main/env'

const db = JSONFileSyncPreset(resolve(appPath()('userData'), 'db.json'), {}) as {
  data: Record<string, unknown>
  write: () => void
  read: () => void
}

export const JSONStore = {
  get: (key: string) => db.data[key],
  set: (key: string, value: Record<string, number | string>) => {
    db.data[key] = value
    db.write()
  },
  has: (key: string) => key in db.data,
  delete: (key: string) => {
    delete db.data[key]
    db.write()
  },
}
