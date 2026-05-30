import { GroupHome } from '@renderer/modules/main/group'
import { useParams } from 'react-router-dom'

export function Component() {
  const { groupName } = useParams()
  return <GroupHome groupName={groupName ? decodeURIComponent(groupName) : undefined} />
}
