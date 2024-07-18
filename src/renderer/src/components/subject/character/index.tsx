import TabsOnly from '@renderer/components/base/tabs'
import CharactersGrid from '@renderer/components/subject/character/gird'
import CharactersGridSkeleton from '@renderer/components/subject/character/gird/skeleton'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectCharacters } from '@renderer/data/hooks/api/character'
import { SubjectId } from '@renderer/data/types/bgm'
import { useEffect, useState } from 'react'

export default function SubjectCharacters({ subjectId }: { subjectId: SubjectId }) {
  const charactersQuery = useQuerySubjectCharacters({ id: subjectId, needKeepPreviousData: false })
  const characters = charactersQuery.data
  const [filter, setFilter] = useState('全部')
  const relations = new Set<string>(['全部', ...(characters?.keys() || [])])
  useEffect(() => {
    setFilter('全部')
  }, [subjectId])
  if (characters?.size === 0) return null
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-2xl font-semibold">角色</h2>
        {characters ? (
          relations.size !== 1 ? (
            <TabsOnly
              currentSelect={filter}
              setCurrentSelect={setFilter}
              tabsContent={relations}
              layoutId="subject-characters-tab"
            />
          ) : null
        ) : (
          <Skeleton className="h-9 w-40" />
        )}
      </div>
      {characters ? (
        <CharactersGrid
          characters={filter === '全部' ? [...characters.values()].flat() : characters.get(filter)!}
        />
      ) : (
        <CharactersGridSkeleton />
      )}
    </section>
  )
}
