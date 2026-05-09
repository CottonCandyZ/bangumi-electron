import { Image } from '@renderer/components/image/image'
import {
  HoverCardContent,
  HoverCardWrapper,
  HoverPopCard,
  PopCardContent,
} from '@renderer/components/hover-pop-card/manual'
import { MyLink } from '@renderer/components/my-link'
import { Badge } from '@renderer/components/ui/badge'
import { CardContent } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { Character } from '@renderer/data/types/character'
import { cn } from '@renderer/lib/utils'
import { isEmpty } from '@renderer/lib/utils/string'
import { Actors } from '@renderer/modules/main/subject/character/gird/actor'
import { Detail } from '@renderer/modules/main/subject/character/gird/detail'
import type { MouseEvent } from 'react'
import { useLocation, useNavigate, useViewTransitionState } from 'react-router-dom'

const sectionId = 'Characters'
export function Item({ character }: { character: Character }) {
  const { key } = useLocation()
  const id = character.id
  const layoutId = `${sectionId}-${id}-${key}`
  const viewTransitionName = `character-avatar-${id}-${key}`
  const isTransitioning = useViewTransitionState(`/character/${id}`)
  const openCharacter = useOpenCharacter(id, viewTransitionName)

  return (
    <HoverPopCard layoutId={layoutId}>
      <HoverCardWrapper
        className="bg-card text-card-foreground rounded-xl border"
        hoverContent={
          <HoverCardContent className="h-full cursor-default">
            <CardContent
              className={cn(
                'flex cursor-pointer flex-row items-start gap-4 p-2',
                isEmpty(character.images.large) && 'pl-4',
              )}
              onClick={openCharacter}
            >
              {!isEmpty(character.images.large) && (
                <MyLink
                  to={`/character/${id}`}
                  state={{ viewTransitionName }}
                  viewTransition
                  className="shrink-0"
                >
                  <Image
                    className="aspect-square size-14 overflow-hidden rounded-lg"
                    imageSrc={character.images.grid}
                    style={{ viewTransitionName: isTransitioning ? viewTransitionName : undefined }}
                  />
                </MyLink>
              )}
              <MetaInfo character={character} viewTransitionName={viewTransitionName} />
            </CardContent>
          </HoverCardContent>
        }
        popContent={<PopCard character={character} />}
      />
    </HoverPopCard>
  )
}

function PopCard({ character }: { character: Character }) {
  const { key } = useLocation()
  const viewTransitionName = `character-avatar-${character.id}-${key}`
  const isTransitioning = useViewTransitionState(`/character/${character.id}`)
  const openCharacter = useOpenCharacter(character.id, viewTransitionName)

  return (
    <PopCardContent className="w-96 cursor-default">
      <CardContent
        className="flex h-full cursor-pointer flex-col overflow-hidden p-2"
        onClick={openCharacter}
      >
        <div className="flex h-full flex-row gap-4">
          {!isEmpty(character.images.large) && (
            <MyLink
              to={`/character/${character.id}`}
              state={{ viewTransitionName }}
              viewTransition
              className="basis-1/4"
            >
              <Image
                className="h-fit overflow-hidden rounded-lg"
                imageSrc={character.images.medium}
                loadingClassName="aspect-square"
                careLoading
                loading="eager"
                style={{ viewTransitionName: isTransitioning ? viewTransitionName : undefined }}
              />
            </MyLink>
          )}
          <div className="flex w-full flex-col gap-2">
            <MetaInfo character={character} showAll viewTransitionName={viewTransitionName} />
            <Separator />
            <Detail characterId={character.id.toString()} />
          </div>
        </div>
      </CardContent>
    </PopCardContent>
  )
}

function useOpenCharacter(characterId: number, viewTransitionName: string) {
  const navigate = useNavigate()

  return (event: MouseEvent<HTMLElement>) => {
    const target = event.target
    if (target instanceof Element && target.closest('a,button')) return

    navigate(`/character/${characterId}`, {
      state: { viewTransitionName },
      viewTransition: true,
    })
  }
}

function MetaInfo({
  character,
  showAll = false,
  viewTransitionName,
}: {
  character: Character
  showAll?: boolean
  viewTransitionName: string
}) {
  return (
    <section className="flex w-full flex-col gap-2">
      <div className="flex flex-row items-start justify-between gap-2">
        <MyLink
          to={`/character/${character.id}`}
          state={{ viewTransitionName }}
          viewTransition
          className="leading-5 font-medium"
        >
          {character.name}
        </MyLink>
        <Badge variant="outline" className="text-primary/70 w-fit shrink-0 text-xs font-medium">
          {character.relation}
        </Badge>
      </div>
      {character.actors.length !== 0 && <Actors actors={character.actors} showAll={showAll} />}
    </section>
  )
}
