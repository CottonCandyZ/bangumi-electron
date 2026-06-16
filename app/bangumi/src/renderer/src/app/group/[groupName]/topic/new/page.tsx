import { CreateGroupTopicPage } from '@renderer/modules/main/group/create-topic'
import { useParams } from 'react-router-dom'

export function Component() {
  const { groupName } = useParams()

  return <CreateGroupTopicPage groupName={groupName ? decodeURIComponent(groupName) : undefined} />
}
