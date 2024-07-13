import { UI_CONFIG } from '@renderer/config'

type toView = {
  toViewTop: number
  toViewLeft: number
  toViewRight: number
  toViewBottom: number
}

export type HoverCardSize = {
  width: number
  height: number
  maxInnerHoverWidth?: number
  maxInnerHoverHeight?: number
  minInnerHoverWidth?: number
  minInnerHoverHeight?: number
} & toView

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

export function cPopSizeByC(
  pop: DOMRect,
  hover: DOMRect,
  toView: toView = { toViewTop: 8, toViewBottom: 8, toViewLeft: 8, toViewRight: 8 },
) {
  let topOffset = -(pop.height - hover.height) / 2
  let leftOffset = -(pop.width - hover.width) / 2
  const toLeft = hover.left + leftOffset
  const toTop = hover.top + topOffset
  const toBottom = window.innerHeight - toTop - pop.height
  const toRight = window.innerWidth - toLeft - pop.width
  console.log(toLeft, toTop, toBottom, window.innerWidth - toLeft)
  if (toTop < UI_CONFIG.HEADER_HEIGHT + toView.toViewTop) {
    const bias = UI_CONFIG.HEADER_HEIGHT + 8 - toTop
    topOffset += bias
  }
  if (toLeft < UI_CONFIG.NAV_WIDTH + toView.toViewLeft) {
    const bias = UI_CONFIG.NAV_WIDTH + 8 - toLeft
    leftOffset += bias
  }
  if (toRight < toView.toViewRight) {
    const bias = 8 - toRight
    leftOffset -= bias
  }
  if (toBottom < toView.toViewBottom) {
    const bias = 8 - toBottom
    topOffset -= bias
  }
  return { topOffset, leftOffset }
}
