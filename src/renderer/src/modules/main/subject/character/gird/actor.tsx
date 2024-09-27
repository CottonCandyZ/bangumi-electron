import { Image } from '@renderer/components/image/image'
import { Actor } from '@renderer/data/types/character'
import { getCharacterAvatarURL } from '@renderer/lib/utils/data-trans'
import { isEmpty } from '@renderer/lib/utils/string'
export function Actors({ actors, showAll = false }: { actors: Actor[]; showAll?: boolean }) {
  return (
    <div className="inline-flex w-full flex-row flex-wrap gap-2 text-sm">
      {actors.map(
        (actor, index) =>
          (showAll || index === 0) && (
            <div key={actor.id} className="flex flex-row items-end gap-2">
              {!isEmpty(actor.images.large) && (
                <Image
                  imageSrc={getCharacterAvatarURL(actor.images.large)}
                  className="size-9 overflow-hidden rounded-md"
                />
              )}
              <span className="line-clamp-1 font-jp">{actor.name}</span>
              {!showAll && actors.length > 1 && (
                <div className="-mb-[3px] flex size-6 items-center justify-center rounded-full border pb-0.5">
                  <div className="text-[0.7rem] text-accent-foreground">+{actors.length - 1}</div>
                </div>
              )}
            </div>
          ),
      )}
    </div>
  )
}
