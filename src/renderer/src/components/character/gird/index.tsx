import { CoverMotionImage } from '@renderer/components/base/CoverMotionImage'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectCharacters } from '@renderer/constants/hooks/api/character'
import { SubjectId } from '@renderer/constants/types/bgm'
import { cn } from '@renderer/lib/utils'
import { getCharacterAvatarURL } from '@renderer/lib/utils/data-trans'
import { isEmpty } from '@renderer/lib/utils/string'
import { useState } from 'react'

export default function CharactersGrid({ subjectId }: { subjectId: SubjectId }) {
  const charactersQuery = useQuerySubjectCharacters({ id: subjectId, enabled: !!subjectId })
  const characters = charactersQuery.data
  const [fold, setFold] = useState(true)
  if (!characters)
    return (
      <div className="grid grid-cols-[repeat(auto-fill,_minmax(14rem,_1fr))] gap-3 pb-2">
        {Array(8)
          .fill(0)
          .map((_, index) => (
            <Skeleton className="h-20" key={index} />
          ))}
      </div>
    )
  const needFold = characters.length > 8
  return (
    <div className={cn('relative max-h-60 overflow-hidden', (!fold || !needFold) && 'max-h-none')}>
      <div className="grid grid-cols-[repeat(auto-fill,_minmax(14rem,_1fr))] gap-3 pb-2">
        {characters.map((item) => (
          <div key={item.id} className="min-w-56 flex-1">
            <Card className="h-full">
              <CardContent className="flex flex-row items-start gap-4 p-2">
                {!isEmpty(item.images.large) ? (
                  <CoverMotionImage
                    className="aspect-square size-14 shrink-0 overflow-hidden rounded-full"
                    imageSrc={getCharacterAvatarURL(item.images.large)}
                  />
                ) : (
                  <div className="aspect-square size-14 rounded-full bg-secondary" />
                )}
                <section>
                  <h3 className="font-medium">{item.name}</h3>
                  <h4 className="text-sm font-medium text-muted-foreground">{item.relation}</h4>
                  {/* <h4 className="text-sm">CV：{item.actors[0].name}</h4> */}
                </section>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      {needFold && (
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 flex h-20 items-end justify-center bg-gradient-to-t from-card',
            !fold && 'relative h-auto',
          )}
        >
          <Button variant="outline" onClick={() => setFold((fold) => !fold)}>
            {fold ? '展开' : '收起'}
          </Button>
        </div>
      )}
    </div>
  )
}
