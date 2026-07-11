import { EditCommunityTopicPage } from '@renderer/modules/main/community/edit-topic'
import { useParams } from 'react-router-dom'

export function Component() {
  const topicId = Number(useParams().topicId)
  return <EditCommunityTopicPage kind="group" topicId={topicId} />
}
