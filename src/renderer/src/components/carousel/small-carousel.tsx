import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@renderer/components/ui/carousel'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface SmallCarouselProps {
  href: string
  name: string
}

export default function SmallCarousel({ href, name }: SmallCarouselProps) {
  return (
    <Carousel
      opts={{
        align: 'start',
        slidesToScroll: 'auto',
      }}
      className="w-full"
    >
      <div className="flex justify-between">
        <Button
          asChild
          variant="ghost"
          className="py-1 px-2 ml-2 group h-min text-lg font-semibold duration-100"
        >
          <Link to={href}>
            <div
              className={`flex gap-1 -translate-x-2 group-hover:translate-x-0 transition-all justify-center
              items-center duration-100 group-hover:text-red-600/70 dark:group-hover:text-red-400`}
            >
              <span>{name}</span>{' '}
              <ChevronRight
                className="h-4 w-4 mt-[1px] text-red-600/50 dark:text-red-600/80  group-hover:text-red-600/70 dark:group-hover:text-red-400"
                strokeWidth={4}
              />
            </div>
          </Link>
        </Button>
        <div className="flex ml-auto w-min gap-2 mb-2">
          <CarouselPrevious className="relative left-0 top-0 translate-y-0" />
          <CarouselNext className="relative right-0 top-0 translate-y-0" />
        </div>
      </div>
      <CarouselContent>
        {Array.from({ length: 24 }).map((_, index) => (
          <CarouselItem
            key={index}
            className="basis-1/4 md:basis-1/5 lg:basis-1/6 xl:basis-[14.285714%] 2xl:basis-[11.111111%]"
          >
            <div className="p-1">
              <Card>
                <CardContent className="flex items-center justify-center p-6 aspect-[9/16]">
                  <span className="text-3xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
