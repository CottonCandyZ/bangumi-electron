// import { BigCarousel } from '@renderer/components/carousel/big-carousel'
import { BroadcastSchedule } from '@renderer/modules/main/home/broadcast-schedule'
import {
  HomeJoinedGroupsPreview,
  HomeTrendingSubjectTopicsPreview,
} from '@renderer/modules/main/home/community-overview'
import { SiteTimelinePreview } from '@renderer/modules/main/home/site-timeline'
import { SmallCarousel, SmallCarouselProps } from '@renderer/modules/main/home/small-carousel'

const primaryCarousel = {
  href: '/anime',
  name: '动画',
  sectionPath: 'anime',
} satisfies SmallCarouselProps

const secondaryCarousels = [
  { href: '/game', name: '游戏', sectionPath: 'game' },
  { href: '/book', name: '书', sectionPath: 'book' },
  { href: '/music', name: '音乐', sectionPath: 'music' },
  { href: '/real', name: '三次元', sectionPath: 'real' },
] satisfies SmallCarouselProps[]

export function Component() {
  return (
    <div className="flex flex-col gap-8 px-8 pt-6 pb-20">
      {/* <section>
        <BigCarousel />
      </section> */}

      <section>
        <SmallCarousel {...primaryCarousel} />
      </section>

      <BroadcastSchedule />

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(520px,760px)_minmax(360px,1fr)] 2xl:grid-cols-[minmax(560px,820px)_minmax(420px,1fr)]">
        <SiteTimelinePreview />
        <div className="flex min-w-0 flex-col gap-6">
          <HomeJoinedGroupsPreview />
          <HomeTrendingSubjectTopicsPreview />
        </div>
      </div>

      {secondaryCarousels.map((item) => (
        <section key={item.sectionPath}>
          <SmallCarousel {...item} />
        </section>
      ))}
    </div>
  )
}
