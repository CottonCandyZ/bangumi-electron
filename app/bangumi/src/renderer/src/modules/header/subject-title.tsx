import { Image } from '@renderer/components/image/image'
import { Button } from '@renderer/components/ui/button'
import { useQueryCharacterDetailByID } from '@renderer/data/hooks/api/character'
import {
  useEpisodeInfoByIdQuery,
  useEpisodesInfoBySubjectIdQuery,
} from '@renderer/data/hooks/api/episodes'
import { useQueryPersonsById } from '@renderer/data/hooks/api/person'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { CharacterId, EpId, PersonId, SubjectId } from '@renderer/data/types/bgm'
import { Subject } from '@renderer/data/types/subject'
import { isEmpty } from '@renderer/lib/utils/string'
import { monoAvatarImageInViewAtom, subjectCoverImageInViewAtom } from '@renderer/state/in-view'
import { openMonoListPanelTabAtomAction } from '@renderer/state/panel'
import { AnimatePresence, motion } from 'motion/react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useLocation } from 'react-router-dom'

export function HeaderTitle() {
  const { pathname } = useLocation()
  const [, route, id] = pathname.split('/')
  if (!id) return null

  if (route === 'subject') return <SubjectHeaderTitle subjectId={id} />
  if (route === 'episode') return <EpisodeHeaderTitle episodeId={id} />
  if (route === 'person') return <PersonHeaderTitle personId={id} />
  if (route === 'character') return <CharacterHeaderTitle characterId={id} />

  return null
}

function SubjectHeaderTitle({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const isInView = useAtomValue(subjectCoverImageInViewAtom)
  if (!subjectInfo) return null
  return (
    <div className="flex h-full items-center overflow-hidden select-none">
      <AnimatePresence key={subjectId}>
        {!isInView && (
          <motion.div
            className="flex flex-row items-center gap-3"
            animate={{ y: 0, opacity: 1 }}
            initial={{ y: '120%', opacity: 0 }}
            exit={{ y: '120%', opacity: 0 }}
          >
            <Image
              className="size-9 shrink-0 overflow-hidden rounded-lg"
              imageSrc={subjectInfo.images.common}
            />
            <Header {...subjectInfo} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EpisodeHeaderTitle({ episodeId }: { episodeId: EpId }) {
  const episodeQuery = useEpisodeInfoByIdQuery({ episodeId })
  const episode = episodeQuery.data
  const subjectInfoQuery = useSubjectInfoQuery({
    subjectId: episode?.subject_id.toString(),
    enabled: !!episode,
    needKeepPreviousData: false,
  })
  const subjectInfo = subjectInfoQuery.data
  const episodesQuery = useEpisodesInfoBySubjectIdQuery({
    subjectId: episode?.subject_id.toString() ?? '',
    limit: 100,
    enabled: !!episode,
  })
  const openMonoListPanelTab = useSetAtom(openMonoListPanelTabAtomAction)

  if (!episode) return null

  return (
    <div className="flex min-w-0 flex-row items-center gap-2">
      <StaticHeaderTitle
        image={subjectInfo?.images.common}
        imageFallback={`ep.${episode.sort}`}
        name={episode.name}
        nameCn={episode.name_cn || `ep.${episode.sort}`}
      />
      {episodesQuery.data?.data && (
        <Button
          variant="ghost"
          size="icon"
          className="no-drag-region size-8 shrink-0"
          onClick={() =>
            openMonoListPanelTab({
              id: `subject-episodes-${episode.subject_id}`,
              type: 'subjectEpisodes',
              title: '章节',
              sourceTitle:
                subjectInfo?.name_cn || subjectInfo?.name || `条目 ${episode.subject_id}`,
              subjectId: episode.subject_id.toString(),
              episodes: episodesQuery.data.data ?? [],
            })
          }
        >
          <span className="i-mingcute-box-3-line text-lg" />
        </Button>
      )}
    </div>
  )
}

function PersonHeaderTitle({ personId }: { personId: PersonId }) {
  const personQuery = useQueryPersonsById({ id: personId })
  const person = personQuery.data
  const isInView = useAtomValue(monoAvatarImageInViewAtom)
  const image = person?.images?.grid || person?.images?.small || person?.images?.medium

  if (!person) return null

  return <StaticHeaderTitle image={image} name={person.name} visible={!isInView} />
}

function CharacterHeaderTitle({ characterId }: { characterId: CharacterId }) {
  const characterQuery = useQueryCharacterDetailByID({ id: characterId })
  const character = characterQuery.data
  const isInView = useAtomValue(monoAvatarImageInViewAtom)
  const image = character?.images?.grid || character?.images?.small || character?.images?.medium

  if (!character) return null

  return <StaticHeaderTitle image={image} name={character.name} visible={!isInView} />
}

function StaticHeaderTitle({
  image,
  imageFallback,
  name,
  nameCn,
  visible = true,
}: {
  image?: string
  imageFallback?: string
  name: string
  nameCn?: string
  visible?: boolean
}) {
  return (
    <div className="flex h-full items-center overflow-hidden select-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            className="flex min-w-0 flex-row items-center gap-3"
            animate={{ y: 0, opacity: 1 }}
            initial={{ y: '120%', opacity: 0 }}
            exit={{ y: '120%', opacity: 0 }}
          >
            {image ? (
              <Image className="size-9 shrink-0 overflow-hidden rounded-lg" imageSrc={image} />
            ) : imageFallback ? (
              <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-medium">
                {imageFallback}
              </div>
            ) : null}
            <Header name={name} name_cn={nameCn ?? ''} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Header({ name, name_cn }: Pick<Subject, 'name' | 'name_cn'>) {
  return (
    <header className="flex flex-auto flex-col">
      {isEmpty(name_cn) ? (
        <h1 className="line-clamp-2 font-medium">{name}</h1>
      ) : (
        <>
          <h1 className="line-clamp-1 font-medium">{name_cn}</h1>
          <h2 className="font-jp text-muted-foreground line-clamp-1 text-xs">{name}</h2>
        </>
      )}
    </header>
  )
}
