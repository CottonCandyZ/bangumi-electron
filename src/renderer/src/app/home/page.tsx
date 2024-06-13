import BigCarousel from '@renderer/components/carousel/big-carousel'
import SmallCarousel from '@renderer/components/carousel/small-carousel'
import { Button } from '@renderer/components/ui/button'
import { getLoginFormHash } from '@renderer/constants/api/login'

export function Component() {
  return (
    <div className="flex flex-col gap-2">
      <Button onClick={async () => await getLoginFormHash()}> TSS </Button>
      <section>
        <BigCarousel />
      </section>
      <section className="px-9">
        <SmallCarousel href="/anime" name="动画" />
      </section>
      <section className="px-9">
        <SmallCarousel href="/game" name="游戏" />
      </section>
      <section className="px-9">
        <SmallCarousel href="/book" name="书" />
      </section>
      <section className="px-9">
        <SmallCarousel href="/music" name="音乐" />
      </section>
      <section className="px-9">
        <SmallCarousel href="/real" name="三次元" />
      </section>
      {/*  时间线 */}
    </div>
  )
}
