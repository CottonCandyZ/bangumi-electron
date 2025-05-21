// import { BigCarousel } from '@renderer/components/carousel/big-carousel'
import {
  SmallCarousel,
  SmallCarouselFallback,
  SmallCarouselProps,
} from '@renderer/modules/main/home/small-carousel'
import { Suspense } from 'react'

const config = [
  { href: '/anime', name: '动画', sectionPath: 'anime' },
  { href: '/game', name: '游戏', sectionPath: 'game' },
  { href: '/book', name: '书', sectionPath: 'book' },
  { href: '/music', name: '音乐', sectionPath: 'music' },
  { href: '/real', name: '三次元', sectionPath: 'real' },
] satisfies SmallCarouselProps[]

export function Component() {
  return (
    <div className="flex flex-col gap-2 pb-20 pt-4">
      {/* <section>
        <BigCarousel />
      </section> */}

      {config.map((item) => (
        <section className="px-9" key={item.sectionPath}>
          <Suspense fallback={<SmallCarouselFallback {...item} />}>
            <SmallCarousel {...item} />
          </Suspense>
        </section>
      ))}

      {/*  时间线 */}
    </div>
  )
}
