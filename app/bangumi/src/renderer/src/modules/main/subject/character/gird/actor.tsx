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
                'flex min-w-0 flex-row gap-2',
                showAll ? 'max-w-full flex-none items-end' : 'flex-1 items-center gap-1.5',
              )}
            >
              <ActorLink actor={actor} showAll={showAll} hasMoreActors={actors.length > 1} />
              {!showAll && actors.length > 1 && (
                <span className="text-muted-foreground shrink-0 text-xs">+{actors.length - 1}</span>
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
      contextMenuTitle={actor.name}
      className={cn(
        'group/actor flex min-w-0 cursor-default flex-row focus-visible:outline-hidden',
        showAll ? 'items-end gap-2' : 'items-center gap-1.5',
        showAll || !hasMoreActors ? 'max-w-full flex-none' : 'max-w-[calc(100%-2rem)] flex-none',
      )}
    >
      {!isEmpty(actor.images.large) && (
        <ViewTransitionImage
          active={isTransitioning}
          imageSrc={getCharacterAvatarURL(actor.images.large)}
          className={cn(
            'shrink-0 overflow-hidden',
            showAll ? 'size-9 rounded-md' : 'size-5 rounded-full',
          )}
          viewTransitionName={viewTransitionName}
        />
      )}
      <span
        className={cn(
          'font-jp line-clamp-1 min-w-0 underline-offset-2 group-hover/actor:underline group-focus-visible/actor:underline',
          showAll
            ? 'text-primary'
            : 'text-muted-foreground group-hover/actor:text-foreground text-xs',
        )}
      >
        {actor.name}
      </span>
    </MyLink>
  )
}
