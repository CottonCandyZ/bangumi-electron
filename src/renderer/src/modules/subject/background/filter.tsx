import { scrollCache, subjectInitScroll } from '@renderer/state/global-var'
import { mainContainerHeight } from '@renderer/state/main-bounding-box'
import { mainPanelScrollPositionAtom } from '@renderer/state/scroll'
import { useAtomValue } from 'jotai'
import { useRef } from 'react'
import { useLocation } from 'react-router-dom'

const init = (top: number, scrollRange: number) => {
  const percent = (top / (scrollRange * 2)) * 100
  return { start: percent * (0.033 * percent), end: percent * 3.5 }
}

export function SubjectBackground() {
  const scrollPosition = useAtomValue(mainPanelScrollPositionAtom)
  const containerHeight = useAtomValue(mainContainerHeight)
  const isFirst = useRef(false)
  const { pathname } = useLocation()
  // 这么写很恶心对吧，因为我无法科学的为 scrollPosition 设定 condition 的 init value,
  // 如果使用其推荐的方案 https://github.com/pmndrs/jotai/discussions/1462，不得不将 scroll wrapper 整个重渲染
  // 会导致换页面的时候有一个慢半拍的 scroll 的动作，当然这责任全在 overlay scroll bar
  // 后面有机会还是用原生的 scroll bar 吧，可以少不少坑
  const value = isFirst ? (scrollCache.get(pathname) ?? subjectInitScroll.x) : scrollPosition
  const { start, end } = init(value, containerHeight)

  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to top, hsl(var(--background)) ${20 + start}%, hsl(var(--background) / 0) ${40 + end}%)`,
      }}
    />
  )
}
