import { EpisodeContent } from '@renderer/modules/main/episode/content'
import { useParams } from 'react-router-dom'

export function Component() {
  const episodeId = useParams().episodeId
  if (!episodeId) throw Error('Get Params Error')

  return <EpisodeContent episodeId={episodeId} />
}
