import { CharacterHeaderTitle } from '@renderer/modules/header/title/mono'
import { EpisodeHeaderTitle } from '@renderer/modules/header/title/episode'
import { PersonHeaderTitle } from '@renderer/modules/header/title/mono'
import { SubjectHeaderTitle } from '@renderer/modules/header/title/subject'
import { UserHeaderTitle } from '@renderer/modules/header/title/user'
import { useLocation } from 'react-router-dom'

export function HeaderTitle() {
  const { pathname } = useLocation()
  const [, route, id] = pathname.split('/')

  if (pathname === '/profile') return <UserHeaderTitle />
  if (!id) return null

  if (route === 'subject') return <SubjectHeaderTitle subjectId={id} />
  if (route === 'episode') return <EpisodeHeaderTitle episodeId={id} />
  if (route === 'person') return <PersonHeaderTitle personId={id} />
  if (route === 'character') return <CharacterHeaderTitle characterId={id} />
  if (route === 'user') return <UserHeaderTitle username={decodeURIComponent(id)} />

  return null
}
