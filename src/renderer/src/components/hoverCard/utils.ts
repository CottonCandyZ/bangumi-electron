import { UI_CONFIG } from '@renderer/config'

export type HoverCardSize = {
  width: number
  height: number
  toViewTop: number
  toViewLeft: number
  toViewRight: number
  toViewBottom: number
  maxInnerHoverWidth?: number
  maxInnerHoverHeight?: number
  minInnerHoverWidth?: number
  minInnerHoverHeight?: number
}

export function cHoverCardSize(hover: DOMRect, hoverCardSize: HoverCardSize) {
  const { width, height, toViewTop, toViewLeft, toViewRight, toViewBottom } = hoverCardSize
  const hoverWidth = threshold(
    hover.width,
    hoverCardSize.maxInnerHoverWidth,
    hoverCardSize.minInnerHoverWidth,
  )
  const hoverHight = threshold(
    hover.height,
    hoverCardSize.maxInnerHoverHeight,
    hoverCardSize.minInnerHoverHeight,
  )
  console.log(hoverWidth)

  let left = -(hoverWidth * width)
  let right = -(hoverWidth * width)
  let top = -(hoverHight * height)
  let bottom = -(hoverHight * height)
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

function threshold(num: number, max: number | undefined, min: number | undefined) {
  if (max !== undefined && num > max) return max
  if (min !== undefined && num < min) return min
  return num
}
