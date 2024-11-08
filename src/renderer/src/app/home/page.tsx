// import { BigCarousel } from '@renderer/components/carousel/big-carousel'
import { Button } from '@renderer/components/ui/button'
import { SmallCarousel, SmallCarouselProps } from '@renderer/modules/main/home/small-carousel'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

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
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary
                onReset={reset}
                onError={(error) => {
                  console.error(error.message)
                }}
                fallbackRender={({ resetErrorBoundary }) => (
                  <div className="flex h-52 w-full flex-col items-center justify-center gap-5 rounded-xl border-[1px] border-destructive">
                    <div className="text-2xl">Ooops 出错了</div>
                    <Button variant={'destructive'} onClick={() => resetErrorBoundary()}>
                      再试一次
                    </Button>
                  </div>
                )}
              >
                <SmallCarousel {...item} />
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </section>
      ))}

      {/*  时间线 */}
    </div>
  )
}
