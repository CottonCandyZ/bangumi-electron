import { Tabs } from '@renderer/components/tabs'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectCharacters } from '@renderer/data/hooks/api/character'
import { SubjectId } from '@renderer/data/types/bgm'
import { CharactersGrid } from '@renderer/modules/main/subject/character/gird'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom } from 'jotai'
import { Suspense } from 'react'

interface Props {
  subjectId: SubjectId
}

export function SubjectCharactersContent({ subjectId }: Props) {
  const charactersQuery = useQuerySubjectCharacters({ id: subjectId })
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
        <Tabs
          tabsContent={relations}
          layoutId={id}
          currentSelect={filter}
          setCurrentSelect={setFilter}
        />
      </div>
      <CharactersGrid
        characters={filter === '全部' ? [...characters.values()].flat() : characters.get(filter)!}
      />
    </section>
  )
}

export function SubjectCharactersSkeleton() {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-2xl font-medium">角色</h2>
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,_minmax(14rem,_1fr))] gap-3 py-2">
        {Array(8)
          .fill(0)
          .map((_, index) => (
            <Skeleton className="h-20" key={index} />
          ))}
      </div>
    </section>
  )
}

export function SubjectCharacters(props: Props) {
  return (
    <Suspense fallback={<SubjectCharactersSkeleton />} key={props.subjectId}>
      <SubjectCharactersContent {...props} />
    </Suspense>
  )
}
