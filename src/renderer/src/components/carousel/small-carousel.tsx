import SubjectCard from '@renderer/components/carousel/subject-card-content'
import { Button } from '@renderer/components/ui/button'
import {
  Carousel,
  CarouselContentNoFlow,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@renderer/components/ui/carousel'
import { sectionPath } from '@renderer/constants/types/web'
import { cn } from '@renderer/lib/utils'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { create } from 'zustand'

interface SmallCarouselProps {
  href: string
  name: string
  sectionPath: sectionPath
}

interface carouselSectionPath {
  sectionPath: sectionPath | null
  setSectionPath: (sectionPath: sectionPath | null) => void
}
export const useCarouselSectionPath = create<carouselSectionPath>()((set) => ({
  sectionPath: null,
  setSectionPath: (sectionPath) => set({ sectionPath }),
}))

export default function SmallCarousel({ href, name, sectionPath }: SmallCarouselProps) {
  const currentSectionPath = useCarouselSectionPath((state) => state.sectionPath)
  return (
    <Carousel
      opts={{
        align: 'start',
        slidesToScroll: 'auto',
        // active
      }}
      className={cn('w-full', currentSectionPath === sectionPath ? 'z-10' : '')}
    >
      <div className="flex justify-between">
        <Button
          asChild
          variant="ghost"
          className="group ml-2 h-min px-2 py-1 text-lg font-semibold duration-100"
        >
          <Link to={href}>
            <div
              className={`flex -translate-x-2 items-center justify-center gap-1 transition-all duration-100 group-hover:translate-x-0 group-hover:text-red-600/70 dark:group-hover:text-red-400`}
            >
              <span>{name}</span>
              <ChevronRight
                className="mt-[1px] h-4 w-4 text-red-600/50 group-hover:text-red-600/70 dark:text-red-600/80 dark:group-hover:text-red-400"
                strokeWidth={4}
              />
            </div>
          </Link>
        </Button>
        <div className="mb-2 ml-auto flex w-min gap-2">
          <CarouselPrevious className="relative left-0 top-0 translate-y-0" />
          <CarouselNext className="relative right-0 top-0 translate-y-0" />
        </div>
      </div>
      <CarouselContentNoFlow className="-ml-3">
        {Array.from({ length: 11 }).map((_, index) => (
          <CarouselItem
            key={index}
            className="basis-1/4 pl-3 md:basis-1/5 lg:basis-1/6 xl:basis-[14.285714%] 2xl:basis-[11.111111%]"
          >
            <div className="p-0.5">
              <SubjectCard index={index} sectionPath={sectionPath} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContentNoFlow>
    </Carousel>
  )
}
