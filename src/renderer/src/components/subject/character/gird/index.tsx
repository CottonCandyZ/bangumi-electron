import Item from '@renderer/components/subject/character/gird/item'
import { Button } from '@renderer/components/ui/button'
import { Character } from '@renderer/data/types/character'
import { cn } from '@renderer/lib/utils'

import { useState } from 'react'

export default function CharactersGrid({ characters }: { characters: Character[] }) {
  const [fold, setFold] = useState(true)
  const slice = fold ? 8 : characters.length
  const needFold = characters.length > 8
  return (
    <div className={cn('relative flex flex-row gap-2', (!fold || !needFold) && 'max-h-none')}>
      <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(15rem,_1fr))] gap-3 py-2">
        {characters.slice(0, slice).map((item) => (
          <Item character={item} key={item.id} />
        ))}
      </div>
      {needFold && (
        <div>
          <Button
            variant="outline"
            className="h-full whitespace-normal"
            onClick={() => setFold((fold) => !fold)}
          >
            {fold ? '展开' : '收起'}
          </Button>
        </div>
      )}
    </div>
  )
}
