import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { Tabs } from '@renderer/components/tabs'
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
      <section className="flex flex-col gap-3">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <h2 className="text-base font-semibold">角色</h2>
            <OpenMonoListPanelButton
              className="size-6"
              disabled
              tab={panelTab}
              title="在侧栏打开角色"
            />
          </div>
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-1">
          {Array(8)
            .fill(0)
            .map((_, index) => (
              <CharacterCardSkeleton key={index} />
            ))}
        </div>
      </section>
    )
  }

  if (characters.size === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-row items-center justify-between gap-6">
        <div className="flex shrink-0 flex-row items-center gap-2">
          <h2 className="text-base font-semibold">角色</h2>
          <OpenMonoListPanelButton className="size-6" tab={panelTab} title="在侧栏打开角色" />
        </div>
        <Tabs
          variant="underline"
          tabsContent={relations}
          layoutId={id}
          currentSelect={filter}
          setCurrentSelect={setFilter}
        />
      </div>
      <CharactersGrid
        characters={filter === '全部' ? allCharacters : (characters.get(filter) ?? allCharacters)}
      />
    </section>
  )
}

function CharacterCardSkeleton() {
  return (
    <div className="flex h-18 flex-row items-center gap-3 p-2">
      <Skeleton className="size-13 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex flex-row items-center gap-1.5">
          <Skeleton className="size-5 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}
