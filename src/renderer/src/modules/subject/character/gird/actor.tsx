import { Image } from '@renderer/components/image/image'
import { Actor } from '@renderer/data/types/character'
import { getCharacterAvatarURL } from '@renderer/lib/utils/data-trans'
export function Actors({ actors, showAll = false }: { actors: Actor[]; showAll?: boolean }) {
  return (
    <div className="inline-flex flex-row flex-wrap gap-2 text-sm">
      {actors.map(
        (actor, index) =>
          (showAll || index === 0) && (
            <div key={actor.id} className="flex flex-row items-center gap-2">
              <Image
                imageSrc={getCharacterAvatarURL(actor.images.large)}
                className="size-9 overflow-hidden rounded-md border"
              />
              <span className="line-clamp-1">{actor.name}</span>
              {!showAll && actors.length > 1 && (
                <div className="mt-0.5 flex size-6 items-center justify-center rounded-full border">
                  <div className="text-[0.7rem] leading-4 text-accent-foreground">
                    + {actors.length - 1}
                  </div>
                </div>
              )}
            </div>
          ),
      )}
    </div>
  )
}
