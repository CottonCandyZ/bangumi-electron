import { UI_CONFIG } from '@renderer/config'

export type HoverCardSize = {
  width: number
  height: number
  toViewTop: number
  toViewLeft: number
  toViewRight: number
  toViewBottom: number
}

export function cHoverCardSize(hover: DOMRect, hoverCardSize: HoverCardSize) {
  const { width, height, toViewTop, toViewLeft, toViewRight, toViewBottom } = hoverCardSize
  let left = -(hover.width * width)
  let right = -(hover.width * width)
  let top = -(hover.height * height)
  let bottom = -(hover.height * height)
  const toLeft = hover.left + left
  const toTop = hover.top + top
  const toBottom = window.innerHeight - hover.bottom + bottom
  const toRight = window.innerWidth - hover.right + right
  if (toTop < UI_CONFIG.HEADER_HEIGHT + toViewTop) {
    const bias = UI_CONFIG.HEADER_HEIGHT + toViewTop - toTop
    top += bias
    bottom -= bias
  }
  if (toLeft < UI_CONFIG.NAV_WIDTH + toViewLeft) {
    const bias = UI_CONFIG.NAV_WIDTH + toViewLeft - toLeft
    left += bias
    right -= bias
  }
  if (toRight < toViewRight) {
    const bias = toViewRight - toRight
    right += bias
    left -= bias
  }
  if (toBottom < toViewBottom) {
    const bias = toViewBottom - toBottom
    bottom += bias
    top -= bias
  }
  return { left, right, top, bottom }
}