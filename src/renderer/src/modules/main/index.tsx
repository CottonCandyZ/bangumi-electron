import { PageScrollWrapper } from '@renderer/components/scroll/page-scroll-wrapper'
import { UI_CONFIG } from '@renderer/config'
import { useResizeObserver } from '@renderer/hooks/use-resize'
import { RightResizablePanel } from '@renderer/modules/panel/right-panel'
import { subjectInitScroll } from '@renderer/state/global-var'
import {
  mainContainerHeight,
  mainContainerLeft,
  mainContainerRight,
  mainContainerWidth,
} from '@renderer/state/main-bounding-box'
import { useSetAtom } from 'jotai'
import { PropsWithChildren, useRef } from 'react'

// 对于 windows 暂时先用 overlay scroll bar，等后面 fluent 稳定了就可以上 Windows fluent scroll bar https://source.chromium.org/chromium/chromium/src/+/main:ui/native_theme/native_theme_features.cc;l=5?q=native_theme_features&ss=chromium%2Fchromium%2Fsrc

export function MainContainer({ children }: PropsWithChildren) {
  const mainContainerRef = useRef<HTMLDivElement>(null)
  const setHeight = useSetAtom(mainContainerHeight)
  const setWidth = useSetAtom(mainContainerWidth)
  const setLeft = useSetAtom(mainContainerLeft)
  const setRight = useSetAtom(mainContainerRight)
  useResizeObserver({
    ref: mainContainerRef,
    callback: (entry) => {
      const height = entry.target.getBoundingClientRect().height
      subjectInitScroll.x = height * UI_CONFIG.SUBJECT_INIT_SCROLL_PERCENT
      setLeft(entry.target.getBoundingClientRect().left)
      setRight(entry.target.getBoundingClientRect().right)
      setHeight(height)
    },
    deps: [setWidth, setHeight],
  })
  return (
    <div className="flex h-full w-full flex-row overflow-hidden">
      <div className="h-full w-full" ref={mainContainerRef}>
        <PageScrollWrapper className="h-full">
          <div className="h-full">{children}</div>
        </PageScrollWrapper>
      </div>
      <RightResizablePanel />
    </div>
  )
}
