import { userLoginInfo, userSession, userInfo as userInfoDatabase } from '@db/index'
import { client } from '@renderer/lib/client'
import { db } from '@renderer/lib/db/bridge'
import { LoginInfo, Token } from '@renderer/data/types/login'
import { eq } from 'drizzle-orm'
import { UserInfo } from '@renderer/data/types/user'
import { returnFirstOrUndefined } from '@renderer/lib/utils/data-trans'

// Login Info

export async function insertLoginInfo(loginInfo: LoginInfo) {
  if (loginInfo.password !== null) {
    const [encryptedPassword] = await client.getSafeStorageEncrypted({
      origin: [loginInfo.password],
    })
    await db
      .insert(userLoginInfo)
      .values({ id: loginInfo.id, email: loginInfo.email, password: encryptedPassword })
      .onConflictDoUpdate({ target: userLoginInfo.email, set: { password: encryptedPassword } })
  } else {
    await db
      .insert(userLoginInfo)
      .values({ id: loginInfo.id, email: loginInfo.email, password: null })
      .onConflictDoNothing()
  }
}

export async function readLoginInfo() {
  return await db.query.userLoginInfo.findMany()
}

export async function deleteLoginInfo({ email }: { email: string }) {
  return await db.delete(userLoginInfo).where(eq(userLoginInfo.email, email))
}

// accessToken

export async function insertAccessToken(sessionInfo: Token) {
  await db.insert(userSession).values(sessionInfo)
}

export async function readAccessToken({ user_id }: { user_id: number }) {
  return returnFirstOrUndefined(
    await db.query.userSession.findMany({
      where: (userSession, { eq }) => eq(userSession.user_id, user_id),
      orderBy: (userSession, { desc }) => [desc(userSession.create_time)],
      limit: 1,
    }),
  )
}

// userInfo
export async function insertUserInfo(userInfo: UserInfo) {
  await db
    .insert(userInfoDatabase)
    .values(userInfo)
    .onConflictDoUpdate({
      target: userInfoDatabase.id,
      set: {
        ...userInfo,
      },
    })
}

export async function readUserInfo({ user_id }: { user_id: number }) {
  return returnFirstOrUndefined(
    await db.query.userInfo.findMany({
      where: (userInfo, { eq }) => eq(userInfo.id, user_id),
      limit: 1,
    }),
  )
}
