// import { BigCarousel } from '@renderer/components/carousel/big-carousel'
import { SmallCarousel } from '@renderer/modules/main/home/small-carousel'

export function Component() {
  return (
    <div className="flex flex-col gap-2 pb-20 pt-4">
      {/* <section>
        <BigCarousel />
      </section> */}
      <section className="px-9">
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
      </section>

      {/*  时间线 */}
    </div>
  )
}
