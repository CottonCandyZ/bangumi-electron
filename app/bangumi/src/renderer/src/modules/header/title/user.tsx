import { useUserInfoByUsernameQuery, useUserProfileQuery } from '@renderer/data/hooks/api/user'
import { useSession } from '@renderer/data/hooks/session'
import { StaticHeaderTitle } from '@renderer/modules/header/title/static'
import { userProfileAvatarInViewAtom } from '@renderer/state/in-view'
import { useAtomValue } from 'jotai'

export function UserHeaderTitle({ username }: { username?: string }) {
  const session = useSession()
  const profileUsername = username ?? session?.username
  const profileQuery = useUserProfileQuery({
    username: profileUsername,
    enabled: !!profileUsername,
  })
  const userInfoQuery = useUserInfoByUsernameQuery({
    username: profileUsername,
    enabled: !!profileUsername,
  })
  const isInView = useAtomValue(userProfileAvatarInViewAtom)
  const canUseSessionFallback = !!session && (!username || username === session.username)
  const user = profileQuery.data ?? userInfoQuery.data ?? (canUseSessionFallback ? session : null)
  const image = user?.avatar.medium || user?.avatar.large || user?.avatar.small

  if (!user) return null

  return (
    <StaticHeaderTitle image={image} name={user.nickname || user.username} visible={!isInView} />
  )
}
