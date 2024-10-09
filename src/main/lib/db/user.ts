import { db } from '@main/lib/db/init'
import { LoginInfo, Token, UserInfo } from '@shared/types/user'

// ADD

/** save login info */
export function AddLoginInfo(loginInfo: LoginInfo) {
  const insert = db.prepare(
    'INSERT INTO UserLoginInfo (email, password) VALUES (@email, @password)',
  )
  insert.run(loginInfo)
}

/** save session */
export function AddSession(info: Token & { user_id: string; cookie: string }) {
  const insert = db.prepare(
    `INSERT INTO UserSession (user_id, access_token, refresh_token, expire_in, cookie)
     VALUES (@user_id, @access_token, @refresh_token, @expire_in, @cookie)`,
  )
  insert.run(info)
}

/** save user info */
export function AddUserInfo(info: UserInfo) {
  const insert = db.prepare(
    `INSERT INTO UserInfo (id, username, nickname, user_group, avatar, sign, time_offset, url)
     VALUES (@id, @username, @nickname, @user_group, @avatar, @sign, @time_offset, @url)`,
  )
  insert.run(info)
}

/**
 * MUTATIONS
 */
