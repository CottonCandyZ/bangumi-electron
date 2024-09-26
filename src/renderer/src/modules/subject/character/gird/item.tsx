import {
  HoverCardContent,
  HoverCardWrapper,
  HoverPopCard,
  PopCardContent,
} from '@renderer/components/hover-pop-card/manual'
import { Badge } from '@renderer/components/ui/badge'
import { CardContent } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { Character } from '@renderer/data/types/character'
import { cn } from '@renderer/lib/utils'
import { getCharacterAvatarURL } from '@renderer/lib/utils/data-trans'
import { isEmpty } from '@renderer/lib/utils/string'
import { useLocation } from 'react-router-dom'
import { Detail } from '@renderer/modules/subject/character/gird/detail'
import { Actors } from '@renderer/modules/subject/character/gird/actor'
import { Image } from '@renderer/components/image/image'
import { activeHoverPopCardAtom } from '@renderer/state/hover-pop-card'
import { useAtomValue } from 'jotai'

const sectionId = 'Characters'
export function Item({ character }: { character: Character }) {
  const { key } = useLocation()
  const id = character.id
  const layoutId = `${sectionId}-${id}-${key}`

  /* eslint-disable */
  // @ts-ignore: framer-motion needed
  const activeId = useAtomValue(activeHoverPopCardAtom) // framer motion 需要其用于确保 re-render ?
  /* eslint-enable */

  return (
    <HoverPopCard layoutId={layoutId}>
      <HoverCardWrapper
        className="rounded-xl border bg-card text-card-foreground"
        hoverContent={
          <HoverCardContent className="h-full cursor-default">
            <CardContent
              className={cn(
                'flex flex-row items-start gap-4 p-2',
                isEmpty(character.images.large) && 'pl-4',
              )}
            >
              {!isEmpty(character.images.large) && (
                <Image
                  className="aspect-square size-14 shrink-0 overflow-hidden rounded-lg"
                  imageSrc={getCharacterAvatarURL(character.images.large)}
                />
              )}
              <MetaInfo character={character} />
            </CardContent>
          </HoverCardContent>
        }
        popContent={<PopCard character={character} />}
      />
    </HoverPopCard>
  )
}

function PopCard({ character }: { character: Character }) {
  return (
    <PopCardContent className="w-96 cursor-default">
      <CardContent className="flex h-full flex-col overflow-hidden p-2">
        <div className="flex h-full flex-row gap-4">
          {!isEmpty(character.images.large) && (
            <Image
              className="h-fit basis-1/4 overflow-hidden rounded-lg"
              imageSrc={character.images.grid}
              loadingClassName="aspect-square"
              loading="eager"
            />
          )}
          <div className="flex w-full flex-col gap-2">
            <MetaInfo character={character} showAll />
            <Separator />
            <Detail characterId={character.id.toString()} />
          </div>
        </div>
      </CardContent>
    </PopCardContent>
  )
}

function MetaInfo({ character, showAll = false }: { character: Character; showAll?: boolean }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <h3 className="font-medium">{character.name}</h3>
        <h4 className="text-sm font-medium text-muted-foreground">
          <Badge variant="outline">{character.relation}</Badge>
        </h4>
      </div>
      {character.actors.length !== 0 && <Actors actors={character.actors} showAll={showAll} />}
    </section>
  )
}
