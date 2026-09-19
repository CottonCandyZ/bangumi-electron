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
import { ListOrdered, ListRestart, RectangleEllipsis } from 'lucide-react'
import { type ReactNode } from 'react'

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
  const cardView = viewMode === 'cards'
  const viewLabel = cardView ? '卡片' : '数字'
  const nextViewLabel = cardView ? '数字' : '卡片'
  const sortLabel = oneBased ? `还原为从 ${episodeSortStart} 开始计数` : '切换为从 1 开始计数'
  return (
    <div className="mb-3 flex min-h-9 flex-wrap items-center justify-between gap-2">
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
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={cardView ? 'secondary' : 'ghost'}
              size="icon"
              className="text-muted-foreground size-7 shrink-0 shadow-none transition-[color,background-color,transform] active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
              aria-label="章节卡片视图"
              aria-pressed={cardView}
              onClick={() => setViewMode(cardView ? 'grid' : 'cards')}
            >
              {cardView ? (
                <RectangleEllipsis className="size-3.5" aria-hidden="true" />
              ) : (
                <ListOrdered className="size-3.5" aria-hidden="true" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            当前为{viewLabel}视图，点击切换为{nextViewLabel}视图
          </TooltipContent>
        </Tooltip>
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
        <div className={cardView ? undefined : 'invisible'} aria-hidden={!cardView}>
          <CarouselNavigation label="章节" />
        </div>
      </div>
    </div>
  )
}
