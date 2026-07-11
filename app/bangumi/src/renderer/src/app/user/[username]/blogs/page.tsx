import { UserBlogsPage } from '@renderer/modules/main/blog/user-blogs-page'
import { useParams } from 'react-router-dom'

export function Component() {
  const { username } = useParams()
  return <UserBlogsPage username={username} />
}
