import { appPath, isDev } from '@main/env'
import BetterSqlite3 from 'better-sqlite3'
import { resolve } from 'node:path'

export const db: BetterSqlite3.Database = new BetterSqlite3(
  resolve(appPath()('userData'), 'store.sqlite'),
  {
    verbose: isDev ? console.log : undefined,
  },
)

export function initDB() {
  /** create DB */
  db.exec(`
    CREATE TABLE IF NOT EXISTS UserLoginInfo (
      email    TEXT PRIMARY KEY,
      password TEXT
    );

    CREATE TABLE IF NOT EXISTS UserInfo (
      id          INTEGER PRIMARY KEY,
      username    TEXT,
      nickname    TEXT,
      user_group  INTEGER,
      avatar      TEXT,
      sign        TEXT,
      url         TEXT,
      time_offset INTEGER
    );

    CREATE TABLE IF NOT EXISTS UserSession (
      user_id       INTEGER,
      access_token  TEXT,
      refresh_token TEXT,
      expire_in     INTEGER,
      create_time   INTEGER DEFAULT (UNIXEPOCH('now')),
      cookie        TEXT
    );
  `)
}
