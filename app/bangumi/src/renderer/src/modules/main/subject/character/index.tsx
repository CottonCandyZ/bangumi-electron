import { Tabs } from '@renderer/components/tabs'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectCharacters } from '@renderer/data/hooks/api/character'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { CharactersGrid } from '@renderer/modules/main/subject/character/gird'
import { openMonoListPanelTabAtomAction } from '@renderer/state/panel'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom, useSetAtom } from 'jotai'

interface Props {
  subjectId: SubjectId
}

export function SubjectCharacters({ subjectId }: Props) {
  const charactersQuery = useQuerySubjectCharacters({ id: subjectId, needKeepPreviousData: false })
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const id = `subject-characters-tab-${subjectId}`
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const openMonoListPanelTab = useSetAtom(openMonoListPanelTabAtomAction)
  const filter = filterMap.get(id) ?? '全部'
  const characters = charactersQuery.data
  const relations = new Set<string>(['全部', ...(characters?.keys() || [])])
  const allCharacters = characters ? [...characters.values()].flat() : []
  const sourceTitle =
    subjectInfoQuery.data?.name_cn || subjectInfoQuery.data?.name || `条目 ${subjectId}`
  const openInSidePanel = () => {
    if (!characters) return

    openMonoListPanelTab({
      id: `subject-characters-${subjectId}`,
      type: 'subjectCharacters',
      title: '角色',
      sourceTitle,
      subjectId,
      characters: allCharacters,
    })
  }

  if (!characters) {
    return (
      <section className="flex flex-col gap-5">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <h2 className="text-2xl font-medium">角色</h2>
            <Button variant="ghost" size="icon" className="mt-1 size-8" onClick={openInSidePanel}>
              <span className="i-mingcute-box-3-line text-lg" />
            </Button>
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3 py-2">
          {Array(8)
            .fill(0)
            .map((_, index) => (
              <Skeleton className="h-20" key={index} />
            ))}
        </div>
      </section>
    )
  }

  if (characters?.size === 0) return null
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          <h2 className="text-2xl font-medium">角色</h2>
          <Button variant="ghost" size="icon" className="mt-1 size-8" onClick={openInSidePanel}>
            <span className="i-mingcute-box-3-line text-lg" />
          </Button>
        </div>
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

function CharactersGridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3 py-2">
      {Array(8)
        .fill(0)
        .map((_, index) => (
          <Skeleton className="h-20" key={index} />
        ))}
    </div>
  )
}
