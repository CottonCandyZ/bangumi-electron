import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { Tabs } from '@renderer/components/tabs'
import { Card } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQuerySubjectCharacters } from '@renderer/data/hooks/api/character'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { CharactersGrid } from '@renderer/modules/main/subject/character/gird'
import { OpenMonoListPanelButton } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import type { MonoListPanelTab } from '@renderer/state/panel'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom } from 'jotai'

interface Props {
  subjectId: SubjectId
}

export function SubjectCharacters({ subjectId }: Props) {
  const charactersQuery = useQuerySubjectCharacters({ id: subjectId, needKeepPreviousData: false })
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  usePageScrollRestoreReady(!charactersQuery.isPending && !subjectInfoQuery.isPending)
  const id = `subject-characters-tab-${subjectId}`
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const filter = filterMap.get(id) ?? '全部'
  const characters = charactersQuery.data
  const relations = new Set<string>(['全部', ...(characters?.keys() || [])])
  const allCharacters = characters ? [...characters.values()].flat() : []
  const sourceTitle =
    subjectInfoQuery.data?.name_cn || subjectInfoQuery.data?.name || `条目 ${subjectId}`
  const panelTab = () => {
    if (!characters) return

    return {
      id: `subject-characters-${subjectId}`,
      type: 'subjectCharacters',
      title: '角色',
      sourceTitle,
      subjectId,
      characters: allCharacters,
    } satisfies MonoListPanelTab
  }

  if (!characters) {
    return (
      <section className="flex flex-col gap-5">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <h2 className="text-2xl font-medium">角色</h2>
            <OpenMonoListPanelButton
              className="mt-1 size-8"
              disabled
              tab={panelTab}
              title="在侧栏打开角色"
            />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3 py-2">
          {Array(8)
            .fill(0)
            .map((_, index) => (
              <CharacterCardSkeleton key={index} />
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
          <OpenMonoListPanelButton className="mt-1 size-8" tab={panelTab} title="在侧栏打开角色" />
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
          <CharacterCardSkeleton key={index} />
        ))}
    </div>
  )
}

function CharacterCardSkeleton() {
  return (
    <Card className="flex h-20 flex-row items-start gap-4 overflow-hidden p-2 shadow-none">
      <Skeleton className="size-14 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-row items-start justify-between gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="flex flex-row items-center gap-2">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </Card>
  )
}
