import { BroadcastSchedule } from '@renderer/modules/main/home/broadcast-schedule'
import {
  HomeJoinedGroupsPreview,
  HomeTrendingSubjectTopicsPreview,
} from '@renderer/modules/main/home/community-overview'
import { SiteTimelinePreview } from '@renderer/modules/main/home/site-timeline'
import { SmallCarousel, type SmallCarouselProps } from '@renderer/modules/main/home/small-carousel'
import './home.css'

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
    <div className="home-page">
      <div className="home-content">
        <div className="home-schedule">
          <BroadcastSchedule />
        </div>

        <section className="home-section" aria-label="热门条目">
          <div className="home-discovery-grid">
            <div className="home-discovery-primary min-w-0">
              <SmallCarousel {...primaryCarousel} />
            </div>
            {secondaryCarousels.map((item) => (
              <div className="min-w-0" key={item.sectionPath}>
                <SmallCarousel {...item} />
              </div>
            ))}
          </div>
        </section>

        <section className="home-section" aria-labelledby="home-community-title">
          <div className="home-section-heading">
            <h2 id="home-community-title">社区动态</h2>
          </div>
          <div className="home-community-grid">
            <div className="home-community-panel">
              <SiteTimelinePreview />
            </div>
            <div className="home-community-aside">
              <div className="home-community-panel">
                <HomeJoinedGroupsPreview />
              </div>
              <div className="home-community-panel">
                <HomeTrendingSubjectTopicsPreview />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
