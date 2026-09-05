import { MyLink } from '@renderer/components/my-link'
import { SubjectCard } from '@renderer/modules/main/home/small-carousel/subject-card-content'
import { Button } from '@renderer/components/ui/button'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@renderer/components/ui/carousel'
import { SectionPath } from '@renderer/data/types/web'
import { useStateHook } from '@renderer/hooks/use-cache-state'
import { cn } from '@renderer/lib/utils'
import { OpenMonoListPanelButton } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import { activeSectionAtom } from '@renderer/state/small-carousel'
import { type MonoListPanelTab } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTopListQuery } from '@renderer/data/hooks/web/subject'
import { useSubjectsInfoQuery } from '@renderer/data/hooks/db/subject'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { QueryRefreshButton } from '@renderer/modules/common/query-refresh-button'
import { QueryFallback } from '@renderer/components/query-fallback'
import { useOnline } from '@renderer/hooks/use-online'
import { userIdAtom } from '@renderer/state/session'
import { CarouselNavigation } from '../carousel-navigation'
import { useCarouselEdgeFade } from '../carousel-edge-fade'

export type SmallCarouselProps = {
  href: string
  name: string
  sectionPath: SectionPath
}

export function SmallCarousel({ href, name, sectionPath }: SmallCarouselProps) {
  const topList = useTopListQuery(sectionPath)
  const subjectIds = topList.data
    ?.map((item) => item.SubjectId)
    .filter((item) => item !== undefined)
  const subjectsQuery = useSubjectsInfoQuery({ subjectIds: subjectIds, enabled: !!subjectIds })
  const userId = useAtomValue(userIdAtom)
  const subjectsInfo = subjectsQuery.data?.filter((subject) => subject && (userId || !subject.nsfw))
  const online = useOnline()
  const currentSectionPath = useAtomValue(activeSectionAtom)
  const [api, setApi] = useState<CarouselApi>()
  const edgeFade = useCarouselEdgeFade(api)
  const { init: initIndex, setter: setIndex } = useStateHook({
    key: `Home-Small-Carousel-${sectionPath}`,
  })
  useEffect(() => {
    if (!api) {
      return
    }
    const cacheState = () => {
      setIndex(api.selectedScrollSnap())
    }
    api.on('select', cacheState)
    return () => {
      api.off('select', cacheState)
    }
  }, [api, setIndex, sectionPath])
  const trendingPanelTab = {
    id: `trending-subjects-${sectionPath}`,
    panelTitle: `热门${name}`,
    sectionPath,
    sourceTitle: '首页',
    sourceTo: '/',
    title: `热门${name}`,
    type: 'trendingSubjects',
  } satisfies MonoListPanelTab

  return (
    <Carousel
      setApi={setApi}
      opts={{
        align: 'start',
        slidesToScroll: 'auto',
        startIndex: (initIndex as number | undefined) ?? 0,
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Button
            asChild
            variant="ghost"
            className="group h-8 px-1 py-1 text-base font-semibold duration-100"
          >
            <MyLink to={href}>
              <div className="flex items-center justify-center gap-1 transition-colors group-hover:text-rose-500">
                <span>{name}</span>
                <ChevronRight className="text-muted-foreground size-3.5" strokeWidth={1.5} />
              </div>
            </MyLink>
          </Button>
        </div>
        <div className="text-muted-foreground ml-auto flex shrink-0 items-center gap-1">
          <OpenMonoListPanelButton
            className="size-7 shrink-0"
            iconClassName="text-sm"
            tab={trendingPanelTab}
            title={`在侧栏打开热门${name}`}
          />
          <QueryRefreshButton
            className="text-muted-foreground hover:text-foreground size-7 [&_span]:text-sm"
            label={
              topList.requiresWebVerification ? `网页验证并刷新热门${name}` : `刷新热门${name}`
            }
            onRefresh={topList.refetch}
            refreshing={topList.isRefreshing}
          />
          <CarouselNavigation label={name} className="ml-1" />
        </div>
      </div>
      <div
        className={cn(
          'broadcast-scroll-fade @container relative',
          currentSectionPath === sectionPath && 'z-40',
        )}
        style={edgeFade}
      >
        {!subjectsInfo?.length &&
        ((topList.data === undefined && (topList.isError || !online)) || subjectsQuery.isError) ? (
          <QueryFallback
            label={`热门${name}`}
            error={topList.error ?? subjectsQuery.error}
            onRetry={() => {
              void subjectsQuery.refetch()
              return topList.refetch()
            }}
          />
        ) : subjectsInfo?.length === 0 ? (
          <div className="text-muted-foreground flex min-h-32 items-center justify-center text-sm">
            暂无可展示的条目。
          </div>
        ) : (
          <CarouselContent className="-ml-3 py-1">
            {subjectsInfo
              ? subjectsInfo.map((subject, index) => (
                  <CarouselItem key={index} className="basis-[clamp(7.5rem,18cqi,10rem)] pl-3">
                    <div className="p-0.5">
                      {subject ? (
                        <SubjectCard subjectInfo={subject} sectionPath={sectionPath} />
                      ) : (
                        <Skeleton className="aspect-2/3 w-full" />
                      )}
                    </div>
                  </CarouselItem>
                ))
              : Array.from({ length: 10 }).map((_, index) => (
                  <CarouselItem key={index} className="basis-[clamp(7.5rem,18cqi,10rem)] pl-3">
                    <div className="p-0.5">
                      <Skeleton className="aspect-2/3 w-full" />
                    </div>
                  </CarouselItem>
                ))}
          </CarouselContent>
        )}
      </div>
    </Carousel>
  )
}
