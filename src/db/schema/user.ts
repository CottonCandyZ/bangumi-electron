import { sqliteTable } from 'drizzle-orm/sqlite-core'
import * as t from 'drizzle-orm/sqlite-core'

// export function initDB() {
//   /** create DB */
//   db.exec(`
//     CREATE TABLE IF NOT EXISTS UserLoginInfo (
//       email    TEXT PRIMARY KEY,
//       password TEXT
//     );
//     CREATE TABLE IF NOT EXISTS UserInfo (
//       id          INTEGER PRIMARY KEY,
//       username    TEXT,
//       nickname    TEXT,
//       user_group  INTEGER,
//       avatar      TEXT,
//       sign        TEXT,
//       url         TEXT,
//       time_offset INTEGER
//     );

//     CREATE TABLE IF NOT EXISTS UserSession (
//       user_id       INTEGER,
//       access_token  TEXT,
//       refresh_token TEXT,
//       expire_in     INTEGER,
//       create_time   INTEGER DEFAULT (UNIXEPOCH('now')),
//       cookie        TEXT
//     );
//   `)
// }

export const userLoginInfo = sqliteTable('UserLoginInfo', {
  email: t.text().primaryKey(),
  password: t.text(),
})
