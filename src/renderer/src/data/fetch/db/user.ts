import { userLoginInfo, userSession } from '@db/index'
import { client } from '@renderer/lib/client'
import { db } from '@renderer/lib/db/bridge'
import { LoginInfo, Token } from '@renderer/data/types/login'

// save

// login info
export async function insertLoginInfo(loginInfo: LoginInfo) {
  const [encryptedEmail, encryptedPassword] = await client.getSafeStorageEncrypted({
    origin: [loginInfo.email, loginInfo.password],
  })
  await db
    .insert(userLoginInfo)
    .values({ ...loginInfo, email: encryptedEmail, password: encryptedPassword })
}

// accessToken
export async function insertAccessToken(sessionInfo: Token) {
  await db.insert(userSession).values(sessionInfo)
}

// get
export async function getAccessToken({ user_id }: { user_id: number }) {
  return await db.query.userSession.findFirst({
    where: (userSession, { eq }) => eq(userSession.user_id, user_id),
    orderBy: (userSession, { desc }) => [desc(userSession.create_time)],
  })
}
