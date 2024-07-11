import Item from '@renderer/components/character/gird/item'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectCharacters } from '@renderer/constants/hooks/api/character'
import { SubjectId } from '@renderer/constants/types/bgm'
import { cn } from '@renderer/lib/utils'

import { useState } from 'react'

export default function CharactersGrid({ subjectId }: { subjectId: SubjectId }) {
  const charactersQuery = useQuerySubjectCharacters({ id: subjectId, enabled: !!subjectId })
  const characters = charactersQuery.data
  const [fold, setFold] = useState(true)

  if (!characters)
    return (
      <div className="grid grid-cols-[repeat(auto-fill,_minmax(14rem,_1fr))] gap-3 py-2">
        {Array(8)
          .fill(0)
          .map((_, index) => (
            <Skeleton className="h-20" key={index} />
          ))}
      </div>
    )
  const slice = fold ? 12 : characters.length
  const needFold = characters.length > 8
  return (
    <div className={cn('relative', (!fold || !needFold) && 'max-h-none')}>
      <div className="grid grid-cols-[repeat(auto-fill,_minmax(14rem,_1fr))] gap-3 py-2">
        {characters.slice(0, slice).map((item) => (
          <Item character={item} key={item.id} />
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
