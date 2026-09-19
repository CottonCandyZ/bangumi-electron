import { Tabs } from '@renderer/components/tabs'
import { Button } from '@renderer/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { CollectionEpisode } from '@renderer/data/types/collection'
import { EpisodeProgressEditor } from '@renderer/modules/common/episodes/progress-editor'
import { useOpenSubjectEpisodesPanel } from '@renderer/modules/common/episodes/use-open-subject-episodes-panel'
import { OpenMonoListPanelButton } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import { CarouselNavigation } from '@renderer/modules/main/home/carousel-navigation'
import { episodeViewModeAtom } from '@renderer/state/episodes'
import { appConfigAtom } from '@renderer/state/app-config'
import { useAtom, useAtomValue } from 'jotai'
import { GalleryHorizontal, Grid2X2, ListRestart } from 'lucide-react'
import { useId, type ReactNode } from 'react'

const viewModes = new Set(['grid', 'cards'])

export function EpisodeToolbar({
  episodeSortStart,
  oneBased,
  onToggleSort,
  episodesPanel,
  progressEpisodes,
  subjectId,
  pagination,
}: {
  episodeSortStart: number
  oneBased: boolean
  onToggleSort: () => void
  episodesPanel: ReturnType<typeof useOpenSubjectEpisodesPanel>
  progressEpisodes: CollectionEpisode[]
  subjectId: string
  pagination: ReactNode
}) {
  const [viewMode, setViewMode] = useAtom(episodeViewModeAtom)
  const showQuickMark = useAtomValue(appConfigAtom).general.showEpisodeQuickMark
  const viewTabsId = useId()
  const sortLabel = oneBased ? `还原为从 ${episodeSortStart} 开始计数` : '切换为从 1 开始计数'
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <h2 className="mr-1 text-2xl font-medium">章节</h2>
        {episodeSortStart !== 1 && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant={oneBased ? 'secondary' : 'ghost'}
                size="icon"
                className="text-muted-foreground size-7 shadow-none"
                aria-label={sortLabel}
                onClick={onToggleSort}
              >
                <ListRestart className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{sortLabel}</TooltipContent>
          </Tooltip>
        )}
        <OpenMonoListPanelButton
          className="size-7"
          disabled={!episodesPanel.canOpen}
          tab={episodesPanel.tab}
          title="在侧栏打开章节"
        />
        {pagination}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {showQuickMark && progressEpisodes.length > 0 && (
          <EpisodeProgressEditor
            episodes={progressEpisodes}
            subjectId={subjectId}
            sortOffset={oneBased ? 1 - episodeSortStart : 0}
          />
        )}
        {viewMode === 'cards' && <CarouselNavigation label="章节" />}
        <Tabs
          aria-label="章节展示模式"
          currentSelect={viewMode}
          setCurrentSelect={(_, value) => setViewMode(value === 'cards' ? 'cards' : 'grid')}
          tabsContent={viewModes}
          layoutId={viewTabsId}
          tabClassName="size-7 p-0"
          getTabLabel={(value) => (value === 'grid' ? '数字视图' : '卡片视图')}
          renderTab={(value) =>
            value === 'grid' ? (
              <Grid2X2 className="size-4" aria-hidden="true" />
            ) : (
              <GalleryHorizontal className="size-4" aria-hidden="true" />
            )
          }
        />
      </div>
    </div>
  )
}
