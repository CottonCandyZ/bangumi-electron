import { MyLink } from '@renderer/components/my-link'
import SubjectCard from '@renderer/modules/home/small-carousel/subject-card-content'
import { Button } from '@renderer/components/ui/button'
import {
  Carousel,
  CarouselApi,
  CarouselContentNoFlow,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@renderer/components/ui/carousel'
import { UI_CONFIG } from '@renderer/config'
import { SectionPath } from '@renderer/data/types/web'
import useStateHook from '@renderer/hooks/cache-state'
import { cn } from '@renderer/lib/utils'
import { activeSectionAtom } from '@renderer/state/small-carousel'
import { useAtomValue } from 'jotai'
import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SmallCarouselProps {
  href: string
  name: string
  sectionPath: SectionPath
}

export default function Index({ href, name, sectionPath }: SmallCarouselProps) {
  const currentSectionPath = useAtomValue(activeSectionAtom)
  const [api, setApi] = useState<CarouselApi>()
  const { init: initIndex, setter: setIndex } = useStateHook({
    key: `Home-Small-Carousel-${sectionPath}`,
  })
  useEffect(() => {
    if (!api) {
      return
    }
    api.on('select', () => {
      if (setIndex) setIndex?.set(`Home-Small-Carousel-${sectionPath}`, api.selectedScrollSnap())
    })
  }, [api])

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
                className="mt-[1px] h-4 w-4 text-red-600/50 group-hover:text-red-600/70 dark:text-red-600/80 dark:group-hover:text-red-400"
                strokeWidth={4}
              />
            </div>
          </MyLink>
        </Button>
        <div className="mb-2 ml-auto flex w-min gap-2">
          <CarouselPrevious className="relative left-0 top-0 translate-y-0" />
          <CarouselNext className="relative right-0 top-0 translate-y-0" />
        </div>
      </div>
      <div className={cn('relative @container', currentSectionPath === sectionPath ? 'z-30' : '')}>
        <CarouselContentNoFlow className="-ml-3">
          {Array.from({ length: UI_CONFIG.HOME_SECTION_CAROUSEL_NUMBER }).map((_, index) => (
            <CarouselItem
              key={index}
              className="basis-1/5 pl-3 @[1024px]:basis-1/6 @[1280px]:basis-[14.285714%] @[1536px]:basis-[11.111111%]"
            >
              <div className="p-0.5">
                <SubjectCard index={index} sectionPath={sectionPath} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContentNoFlow>
      </div>
    </Carousel>
  )
}
