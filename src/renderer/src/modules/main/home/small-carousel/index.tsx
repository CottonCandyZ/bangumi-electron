import { MyLink } from '@renderer/components/my-link'
import { SubjectCard } from '@renderer/modules/main/home/small-carousel/subject-card-content'
import { Button } from '@renderer/components/ui/button'
import {
  Carousel,
  CarouselApi,
  CarouselContentNoFlow,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@renderer/components/ui/carousel'
import { SectionPath } from '@renderer/data/types/web'
import { useStateHook } from '@renderer/hooks/use-cache-state'
import { cn } from '@renderer/lib/utils'
import { activeSectionAtom } from '@renderer/state/small-carousel'
import { useAtomValue } from 'jotai'
import { ChevronRight } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { useTopListQuery } from '@renderer/data/hooks/web/subject'
import { useSuspenseSubjectsInfoQuery } from '@renderer/data/hooks/db/subject'
import { Skeleton } from '@renderer/components/ui/skeleton'

export type SmallCarouselProps = {
  href: string
  name: string
  sectionPath: SectionPath
}

function SmallCarouselContent({ href, name, sectionPath }: SmallCarouselProps) {
  const topList = useTopListQuery(sectionPath)
  const subjectIds = topList.data
    ?.map((item) => item.SubjectId)
    .filter((item) => item !== undefined)
  const subjectsInfo = useSuspenseSubjectsInfoQuery({ subjectIds: subjectIds }).data

  const currentSectionPath = useAtomValue(activeSectionAtom)
  const [api, setApi] = useState<CarouselApi>()
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

  return (
    <Carousel
      setApi={setApi}
      opts={{
        align: 'start',
        slidesToScroll: 'auto',
        startIndex: (initIndex as number | undefined) ?? 0,
      }}
    >
      <div className="flex justify-between">
        <Button
          asChild
          variant="ghost"
          className="group ml-1 h-min px-2 py-1 text-xl font-medium duration-100"
        >
          <MyLink to={href}>
            <div
              className={`flex -translate-x-2 items-center justify-center gap-1 transition-all duration-100 group-hover:translate-x-0 group-hover:text-red-600/70 dark:group-hover:text-red-400`}
            >
              <span>{name}</span>
              <ChevronRight
                className="mt-px h-4 w-4 text-red-600/50 group-hover:text-red-600/70 dark:text-red-600/80 dark:group-hover:text-red-400"
                strokeWidth={4}
              />
            </div>
          </MyLink>
        </Button>
        <div className="mb-2 ml-auto flex w-min gap-2">
          <CarouselPrevious className="relative top-0 left-0 translate-y-0" />
          <CarouselNext className="relative top-0 right-0 translate-y-0" />
        </div>
      </div>
      <div className={cn('@container relative', currentSectionPath === sectionPath && 'z-40')}>
        <CarouselContentNoFlow className="-ml-3">
          {subjectsInfo.map((subject, index) => (
            <CarouselItem
              key={index}
              className="@8xl:basis-[11.111111%] @9xl:basis-[10%] basis-1/5 pl-3 @4xl:basis-1/6 @5xl:basis-[14.285714%]"
            >
              <div className="p-0.5">
                {subject ? (
                  <SubjectCard subjectInfo={subject} sectionPath={sectionPath} />
                ) : (
                  <Skeleton className="aspect-2/3 w-full" />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContentNoFlow>
      </div>
    </Carousel>
  )
}

/** just copy */
function SmallCarouselSkeleton({ href, name }: SmallCarouselProps) {
  return (
    <Carousel
      opts={{
        align: 'start',
        slidesToScroll: 'auto',
        startIndex: 0,
      }}
    >
      <div className="flex justify-between">
        <Button
          asChild
          variant="ghost"
          className="group ml-1 h-min px-2 py-1 text-xl font-medium duration-100"
        >
          <MyLink to={href}>
            <div
              className={`flex -translate-x-2 items-center justify-center gap-1 transition-all duration-100 group-hover:translate-x-0 group-hover:text-red-600/70 dark:group-hover:text-red-400`}
            >
              <span>{name}</span>
              <ChevronRight
                className="mt-px h-4 w-4 text-red-600/50 group-hover:text-red-600/70 dark:text-red-600/80 dark:group-hover:text-red-400"
                strokeWidth={4}
              />
            </div>
          </MyLink>
        </Button>
        <div className="mb-2 ml-auto flex w-min gap-2">
          <CarouselPrevious className="relative top-0 left-0 translate-y-0" disabled />
          <CarouselNext className="relative top-0 right-0 translate-y-0" disabled />
        </div>
      </div>
      <div className="@container relative">
        <CarouselContentNoFlow className="-ml-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <CarouselItem
              key={index}
              className="@8xl:basis-[11.111111%] @9xl:basis-[10%] basis-1/5 pl-3 @4xl:basis-1/6 @5xl:basis-[14.285714%]"
            >
              <div className="p-0.5">
                <Skeleton className="aspect-2/3 w-full" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContentNoFlow>
      </div>
    </Carousel>
  )
}

export function SmallCarousel(props: SmallCarouselProps) {
  return (
    <Suspense fallback={<SmallCarouselSkeleton {...props} />}>
      <SmallCarouselContent {...props} />
    </Suspense>
  )
}
