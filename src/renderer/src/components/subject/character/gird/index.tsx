import Item from '@renderer/components/subject/character/gird/item'
import { Button } from '@renderer/components/ui/button'
import { Character } from '@renderer/data/types/character'

import { useState } from 'react'

export default function CharactersGrid({ characters }: { characters: Character[] }) {
  const [fold, setFold] = useState(true)
  const slice = fold ? 8 : characters.length
  const needFold = characters.length > 8
  return (
    <div className="relative flex flex-row gap-2">
      <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(15rem,_1fr))] gap-3 py-2">
        {characters.slice(0, slice).map((item) => (
          <Item character={item} key={item.id} />
        ))}
      </div>
      {needFold && (
        <div className="py-2">
          <Button
            variant="outline"
            className="h-full whitespace-normal rounded-xl"
            onClick={() => setFold((fold) => !fold)}
          >
            {fold ? '展开' : '收起'}
          </Button>
        </div>
      )}
    </div>
  )
}
