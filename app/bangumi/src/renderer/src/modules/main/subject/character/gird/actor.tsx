import { Image } from '@renderer/components/image/image'
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
        showAll ? 'flex-wrap' : 'flex-nowrap',
      )}
    >
      {actors.map(
        (actor, index) =>
          (showAll || index === 0) && (
            <div key={actor.id} className="flex min-w-0 flex-1 flex-row items-end gap-2">
              <ActorLink actor={actor} />
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

function ActorLink({ actor }: { actor: Actor }) {
  const { key } = useLocation()
  const isTransitioning = useViewTransitionState(`/person/${actor.id}`)
  const viewTransitionName = `person-avatar-${actor.id}-${key}`

  return (
    <MyLink
      to={`/person/${actor.id}`}
      state={{ viewTransitionName }}
      viewTransition
      className="hover:text-primary flex min-w-0 flex-1 flex-row items-end gap-2"
    >
      {!isEmpty(actor.images.large) && (
        <Image
          imageSrc={getCharacterAvatarURL(actor.images.large)}
          className="size-9 shrink-0 overflow-hidden rounded-md"
          style={{ viewTransitionName: isTransitioning ? viewTransitionName : undefined }}
        />
      )}
      <span className="font-jp line-clamp-1 min-w-0">{actor.name}</span>
    </MyLink>
  )
}
