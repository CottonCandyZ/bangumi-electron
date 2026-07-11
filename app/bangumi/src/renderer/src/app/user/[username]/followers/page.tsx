import { UserFollowersPage } from '@renderer/modules/main/user/relationships-page'
import { useParams } from 'react-router-dom'

export function Component() {
  const { username } = useParams()
  return <UserFollowersPage username={username} />
}
