import BigCarousel from '@renderer/components/carousel/big-carousel'
import Index from '@renderer/modules/home/small-carousel'

export function Component() {
  return (
    <div className="flex flex-col gap-2 pb-20 pt-10">
      <section>
        <BigCarousel />
      </section>
      <section className="px-9">
        <Index href="/anime" name="动画" sectionPath="anime" />
      </section>
      <section className="px-9">
        <Index href="/game" name="游戏" sectionPath="game" />
      </section>
      <section className="px-9">
        <Index href="/book" name="书" sectionPath="book" />
      </section>
      <section className="px-9">
        <Index href="/music" name="音乐" sectionPath="music" />
      </section>
      <section className="px-9">
        <Index href="/real" name="三次元" sectionPath="real" />
      </section>

      {/*  时间线 */}
    </div>
  )
}
