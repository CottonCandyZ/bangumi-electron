import SmallCarousel from '@renderer/components/carousel/small-carousel'
import CollectionsGrid from '@renderer/components/collections/grid'
import { BackCover } from '@renderer/components/hover-card/close'
import { useIsLoginQuery } from '@renderer/data/hooks/session'

export function Component() {
  const isLogin = useIsLoginQuery()
  return (
    <div className="flex flex-col gap-2 pb-20 pt-10">
      {/* <section>
        <BigCarousel />
      </section> */}
      <section className="px-9">{isLogin && <CollectionsGrid />}</section>
      {/* <section className="px-9">
        <SmallCarousel href="/anime" name="动画" sectionPath="anime" />
      </section>
      <section className="px-9">
        <SmallCarousel href="/game" name="游戏" sectionPath="game" />
      </section>
      <section className="px-9">
        <SmallCarousel href="/book" name="书" sectionPath="book" />
      </section>
      <section className="px-9">
        <SmallCarousel href="/music" name="音乐" sectionPath="music" />
      </section>
      <section className="px-9">
        <SmallCarousel href="/real" name="三次元" sectionPath="real" />
      </section> */}

      {/*  时间线 */}
      <BackCover />
    </div>
  )
}
