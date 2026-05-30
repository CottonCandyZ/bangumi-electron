import { CommunityTopicDetail } from '@renderer/modules/main/community/topic-detail'
import { useParams } from 'react-router-dom'

export function Component() {
  const { topicId } = useParams()

  return <CommunityTopicDetail kind="group" topicId={Number(topicId)} />
}
