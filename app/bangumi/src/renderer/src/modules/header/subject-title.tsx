import { CharacterHeaderTitle } from '@renderer/modules/header/title/mono'
import { CommunityTopicHeaderTitle } from '@renderer/modules/header/title/community'
import { EpisodeHeaderTitle } from '@renderer/modules/header/title/episode'
import { IndexHeaderTitle } from '@renderer/modules/header/title/index'
import { PersonHeaderTitle } from '@renderer/modules/header/title/mono'
import { SubjectHeaderTitle } from '@renderer/modules/header/title/subject'
import { UserHeaderTitle } from '@renderer/modules/header/title/user'
import { useLocation } from 'react-router-dom'

export function HeaderTitle() {
  const { pathname } = useLocation()
  const [, route, id, nestedId] = pathname.split('/')

  if (pathname === '/profile') return <UserHeaderTitle />
  if (pathname === '/talk') return null
  if (route === 'group' && id === 'topic' && nestedId) {
    return <CommunityTopicHeaderTitle kind="group" topicId={Number(nestedId)} />
  }
  if (route === 'group' && id) return null
  if (route === 'subject' && id === 'topic' && nestedId) {
    return <CommunityTopicHeaderTitle kind="subject" topicId={Number(nestedId)} />
  }
  if (!id) return null

  if (route === 'subject') return <SubjectHeaderTitle subjectId={id} />
  if (route === 'episode') return <EpisodeHeaderTitle episodeId={id} />
  if (route === 'index') return <IndexHeaderTitle indexId={Number(id)} />
  if (route === 'person') return <PersonHeaderTitle personId={id} />
  if (route === 'character') return <CharacterHeaderTitle characterId={id} />
  if (route === 'user') return <UserHeaderTitle username={decodeURIComponent(id)} />

  return null
}
