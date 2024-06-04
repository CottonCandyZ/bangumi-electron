import SmallCarousel from '@renderer/components/small-carousel'

export default function Home(): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <section>
        <SmallCarousel href="/anime" name="动画" />
      </section>
      <section>
        <SmallCarousel href="/game" name="游戏" />
      </section>
      <section>
        <SmallCarousel href="/book" name="书" />
      </section>
      <section>
        <SmallCarousel href="/music" name="音乐" />
      </section>
      <section>
        <SmallCarousel href="/real" name="三次元" />
      </section>
      {/* 时间线 */}
    </div>
  )
}
