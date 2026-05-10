import { ViewTransitionImage } from '@renderer/components/image/view-transition-image'
import { MyLink } from '@renderer/components/my-link'
import { Actor } from '@renderer/data/types/character'
import { cn } from '@renderer/lib/utils'
import { getCharacterAvatarURL } from '@renderer/lib/utils/data-trans'
import { isEmpty } from '@renderer/lib/utils/string'
import { useLocation, useViewTransitionState } from 'react-router-dom'

export function Actors({ actors, showAll = false }: { actors: Actor[]; showAll?: boolean }) {
  return (
    <div
      className={cn(
        'inline-flex w-full min-w-0 flex-row gap-2 overflow-hidden text-sm',
        showAll ? 'flex-wrap content-start overflow-visible' : 'flex-nowrap',
      )}
    >
      {actors.map(
        (actor, index) =>
          (showAll || index === 0) && (
            <div
              key={actor.id}
              className={cn(
                'flex min-w-0 flex-row items-end gap-2',
                showAll ? 'max-w-full flex-none' : 'flex-1',
              )}
            >
              <ActorLink actor={actor} showAll={showAll} hasMoreActors={actors.length > 1} />
              {!showAll && actors.length > 1 && (
                <div className="-mb-[3px] flex size-6 shrink-0 items-center justify-center rounded-full border pb-0.5">
                  <div className="text-accent-foreground text-[0.7rem]">+{actors.length - 1}</div>
                </div>
              )}
            </div>
          ),
      )}
    </div>
  )
}

function ActorLink({
  actor,
  showAll,
  hasMoreActors,
}: {
  actor: Actor
  showAll: boolean
  hasMoreActors: boolean
}) {
  const { key } = useLocation()
  const isTransitioning = useViewTransitionState(`/person/${actor.id}`)
  const viewTransitionName = `person-avatar-${actor.id}-${key}`

  return (
    <MyLink
      to={`/person/${actor.id}`}
      state={{ viewTransitionName }}
      viewTransition
      className={cn(
        'group/actor flex min-w-0 flex-row items-end gap-2 focus-visible:outline-hidden',
        showAll || !hasMoreActors ? 'max-w-full flex-none' : 'max-w-[calc(100%-2rem)] flex-none',
      )}
    >
      {!isEmpty(actor.images.large) && (
        <ViewTransitionImage
          active={isTransitioning}
          imageSrc={getCharacterAvatarURL(actor.images.large)}
          className="size-9 shrink-0 overflow-hidden rounded-md"
          viewTransitionName={viewTransitionName}
        />
      )}
      <span className="font-jp text-primary line-clamp-1 min-w-0 underline-offset-2 group-hover/actor:underline group-focus-visible/actor:underline">
        {actor.name}
      </span>
    </MyLink>
  )
}
