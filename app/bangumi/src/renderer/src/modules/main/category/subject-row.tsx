import { MyLink } from '@renderer/components/my-link'
import { QueryFallback } from '@renderer/components/query-fallback'
import { Button } from '@renderer/components/ui/button'
import { Carousel, CarouselContent, CarouselItem } from '@renderer/components/ui/carousel'
import { Skeleton } from '@renderer/components/ui/skeleton'
import type { Subject } from '@renderer/data/types/subject'
import type { SectionPath } from '@renderer/data/types/web'
import { cn } from '@renderer/lib/utils'
import { QueryRefreshButton } from '@renderer/modules/common/query-refresh-button'
import { useCarouselColumns } from '@renderer/modules/main/home/carousel-columns'
import { CarouselNavigation } from '@renderer/modules/main/home/carousel-navigation'
import { SubjectCard } from '@renderer/modules/main/home/small-carousel/subject-card-content'
import { OpenMonoListPanelButton } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import type { MonoListPanelTab } from '@renderer/state/panel'
import { ChevronRight } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'

export type SubjectRowProps = {
  /** Unique on the page; scopes the cards' shared-layout ids. */
  id: string
  title: string
  description?: ReactNode
  sectionPath: SectionPath
  subjects: Subject[] | undefined
  error?: unknown
  failed: boolean
  refreshing: boolean
  onRefresh: () => unknown
  href?: string
  panelTab?: MonoListPanelTab
}

export function SubjectRow({
  id,
  title,
  description,
  sectionPath,
  subjects,
  error,
  failed,
  refreshing,
  onRefresh,
  href,
  panelTab,
}: SubjectRowProps) {
  const { ref: rowRef, itemStyle } = useCarouselColumns<HTMLDivElement>()
  // The expanded hover card must stack above the rows after this one.
  const [active, setActive] = useState(false)
  const onActiveChange = useCallback((value: boolean) => setActive(value), [])

  return (
    <Carousel opts={{ align: 'start', slidesToScroll: 'auto' }}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          {href ? (
            <Button
              asChild
              variant="ghost"
              className="group h-8 shrink-0 px-2 py-1 text-base font-semibold duration-100"
            >
              <MyLink to={href} contextMenuTitle={title}>
                <span className="flex -translate-x-2 items-center gap-1 transition-all duration-100 group-hover:translate-x-0 group-hover:text-red-600/70 dark:group-hover:text-red-400">
                  {title}
                  <ChevronRight
                    className="mt-px h-4 w-4 text-red-600/50 group-hover:text-red-600/70 dark:text-red-600/80 dark:group-hover:text-red-400"
                    strokeWidth={4}
                  />
                </span>
              </MyLink>
            </Button>
          ) : (
            <h2 className="shrink-0 text-base font-semibold">{title}</h2>
          )}
          {description && (
            <span className="text-muted-foreground truncate text-xs">{description}</span>
          )}
        </div>
        <div className="text-muted-foreground ml-auto flex shrink-0 items-center gap-1">
          {panelTab && (
            <OpenMonoListPanelButton
              className="size-7 shrink-0"
              iconClassName="text-sm"
              tab={panelTab}
              title={`在侧栏打开${title}`}
            />
          )}
          <QueryRefreshButton
            className="text-muted-foreground hover:text-foreground size-7 [&_span]:text-sm"
            label={`刷新${title}`}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
          <CarouselNavigation label={title} className="ml-1" />
        </div>
      </div>
      <div ref={rowRef} className={cn('relative', active && 'z-40')}>
        {!subjects?.length && failed ? (
          <QueryFallback label={title} error={error} onRetry={onRefresh} />
        ) : subjects?.length === 0 ? (
          <div className="text-muted-foreground flex min-h-32 items-center justify-center text-sm">
            暂无可展示的条目。
          </div>
        ) : (
          <CarouselContent className="-ml-3 py-1">
            {subjects
              ? subjects.map((subject) => (
                  <CarouselItem key={subject.id} className="pl-3" style={itemStyle}>
                    <div className="p-0.5">
                      <SubjectCard
                        subjectInfo={subject}
                        sectionPath={sectionPath}
                        layoutScope={`Category-${id}`}
                        onActiveChange={onActiveChange}
                      />
                    </div>
                  </CarouselItem>
                ))
              : Array.from({ length: 10 }).map((_, index) => (
                  <CarouselItem key={index} className="pl-3" style={itemStyle}>
                    <div className="p-0.5">
                      <Skeleton
                        className={cn(
                          'aspect-2/3 w-full',
                          sectionPath === 'music' && 'aspect-square',
                        )}
                      />
                      <Skeleton className="mt-2 h-4 w-3/4" />
                    </div>
                  </CarouselItem>
                ))}
          </CarouselContent>
        )}
      </div>
    </Carousel>
  )
}
