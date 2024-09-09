import { UI_CONFIG } from '@renderer/config'
import { clamp } from '@renderer/lib/utils/tool'
import { panelSize } from '@renderer/state/global-var'

type ViewMargins = {
  top: number
  left: number
  right: number
  bottom: number
}

export type HoverCardSize = {
  width: number
  height: number
  maxWidth?: number
  maxHeight?: number
  minWidth?: number
  minHeight?: number
}

/** 根据 hover 的大小计算 pop 的位置 */
export function calculatePopCardPosition(
  hover: DOMRect,
  hoverCardSize: HoverCardSize,
  viewMargins: ViewMargins = { top: 8, left: 8, right: 8, bottom: 8 },
  isFixed: boolean = false,
) {
  const { width, height, maxWidth, maxHeight, minWidth, minHeight } = hoverCardSize
  const { top: marginTop, left: marginLeft, right: marginRight, bottom: marginBottom } = viewMargins

  const hoverWidth = clamp(hover.width, minWidth, maxWidth)
  const hoverHeight = clamp(hover.height, minHeight, maxHeight)
  const popWidth = hoverWidth * width
  const popHeight = hoverHeight * height

  let left = hover.left + (hover.width - popWidth) / 2
  let top = hover.top + (hover.height - popHeight) / 2

  const viewportLeft = UI_CONFIG.NAV_WIDTH + marginLeft + panelSize.left_width
  const viewportRight = window.innerWidth - marginRight - panelSize.right_width
  const viewportTop = UI_CONFIG.HEADER_HEIGHT + marginTop
  const viewportBottom = window.innerHeight - marginBottom

  left = clamp(left, viewportLeft, viewportRight - popWidth)
  top = clamp(top, viewportTop, viewportBottom - popHeight)

  if (!isFixed) {
    left -= hover.left
    top -= hover.top
  }

  return { left, top, width: popWidth, height: popHeight }
}

/** 根据 pop 的大小计算 pop 的位置 */
export function calculatePopSizePosition(
  pop: DOMRect,
  hover: DOMRect,
  viewMargins: ViewMargins = { top: 8, left: 8, right: 8, bottom: 8 },
  isFixed: boolean = false,
) {
  const { top: marginTop, left: marginLeft, right: marginRight, bottom: marginBottom } = viewMargins

  let left = hover.left + (hover.width - pop.width) / 2
  let top = hover.top + (hover.height - pop.height) / 2

  const viewportLeft = UI_CONFIG.NAV_WIDTH + marginLeft + panelSize.left_width
  const viewportRight = window.innerWidth - marginRight - panelSize.right_width
  const viewportTop = UI_CONFIG.HEADER_HEIGHT + marginTop
  const viewportBottom = window.innerHeight - marginBottom

  left = clamp(left, viewportLeft, viewportRight - pop.width)
  top = clamp(top, viewportTop, viewportBottom - pop.height)

  if (!isFixed) {
    left -= hover.left
    top -= hover.top
  }

  return { left, top }
}
