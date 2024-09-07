import Tabs from '@renderer/components/tabs'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectCharacters } from '@renderer/data/hooks/api/character'
import { SubjectId } from '@renderer/data/types/bgm'
import CharactersGrid from '@renderer/modules/subject/character/gird'
import CharactersGridSkeleton from '@renderer/modules/subject/character/gird/skeleton'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom } from 'jotai'

export default function SubjectCharacters({ subjectId }: { subjectId: SubjectId }) {
  const charactersQuery = useQuerySubjectCharacters({ id: subjectId, needKeepPreviousData: false })
  const id = `subject-characters-tab-${subjectId}`
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const filter = filterMap.get(id) ?? '全部'
  const characters = charactersQuery.data
  const relations = new Set<string>(['全部', ...(characters?.keys() || [])])

  if (characters?.size === 0) return null
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-2xl font-medium">角色</h2>
        {characters ? (
          <Tabs
            tabsContent={relations}
            layoutId={id}
            currentSelect={filter}
            setCurrentSelect={setFilter}
          />
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
