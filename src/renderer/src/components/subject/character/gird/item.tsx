import { Image } from '@renderer/components/base/Image'
import { HoverCardContent, HoverPopCard, PopCardContent } from '@renderer/components/hover-card'
import Actors from '@renderer/components/subject/character/gird/actor'
import Detail from '@renderer/components/subject/character/gird/detail'
import { Badge } from '@renderer/components/ui/badge'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { Character } from '@renderer/data/types/character'
import { cn } from '@renderer/lib/utils'
import { getCharacterAvatarURL } from '@renderer/lib/utils/data-trans'
import { isEmpty } from '@renderer/lib/utils/string'
import { useLocation } from 'react-router-dom'

const sectionId = 'Characters'
export default function Item({ character }: { character: Character }) {
  const { key } = useLocation()
  const id = character.id
  const layoutId = `${sectionId}-${id}-${key}`
  return (
    <HoverPopCard layoutId={layoutId}>
      <HoverCardContent className="h-full cursor-default">
        <Card className="h-full hover:-translate-y-0.5 hover:shadow-xl hover:duration-700">
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
        </Card>
      </HoverCardContent>
      <PopCard character={character} />
    </HoverPopCard>
  )
}

function PopCard({ character }: { character: Character }) {
  return (
    <PopCardContent className="w-96 cursor-default">
      <Card>
        <CardContent className="flex h-full flex-col p-2">
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
              <MetaInfo character={character} />
              <Separator />
              <Detail characterId={character.id.toString()} />
            </div>
          </div>
        </CardContent>
      </Card>
    </PopCardContent>
  )
}

function MetaInfo({ character }: { character: Character }) {
  return (
    <section className="flex flex-col gap-1">
      <div className="flex flex-col gap-0.5">
        <h3 className="font-medium">{character.name}</h3>
        <h4 className="text-sm font-medium text-muted-foreground">
          <Badge variant="outline">{character.relation}</Badge>
        </h4>
      </div>
      {character.actors.length !== 0 && (
        <div className="flex flex-row text-sm">
          CV：
          <Actors actors={character.actors} />
        </div>
      )}
    </section>
  )
}
