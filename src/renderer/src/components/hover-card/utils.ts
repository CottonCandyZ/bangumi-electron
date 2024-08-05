import { panelSize } from '@renderer/components/wrapper/state-wrapper'
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
  if (toLeft < UI_CONFIG.NAV_WIDTH + toViewLeft + panelSize.left_width) {
    const bias = UI_CONFIG.NAV_WIDTH + toViewLeft + panelSize.left_width - toLeft
    left += bias
    right -= bias
  }
  if (toRight < toViewRight + panelSize.right_width) {
    const bias = toViewRight + panelSize.right_width - toRight
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

export function cHoverCardSizeFixed(hover: DOMRect, hoverCardSize: HoverCardSize) {
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

  const left = -(hoverWidth * width)
  const right = -(hoverWidth * width)
  const top = -(hoverHight * height)
  const bottom = -(hoverHight * height)
  let toLeft = hover.left + left
  let toTop = hover.top + top
  let toBottom = window.innerHeight - hover.bottom + bottom
  let toRight = window.innerWidth - hover.right + right
  if (toTop < UI_CONFIG.HEADER_HEIGHT + toViewTop) {
    const bias = UI_CONFIG.HEADER_HEIGHT + toViewTop - toTop
    toTop = UI_CONFIG.HEADER_HEIGHT + toViewTop - toTop
    toBottom -= bias
  }
  if (toLeft < UI_CONFIG.NAV_WIDTH + toViewLeft) {
    const bias = UI_CONFIG.NAV_WIDTH + toViewLeft + panelSize.left_width - toLeft
    toLeft = UI_CONFIG.NAV_WIDTH + toViewLeft + panelSize.left_width - toLeft
    toRight -= bias
  }
  if (toRight < toViewRight + panelSize.right_width) {
    const bias = toViewRight + panelSize.right_width - toRight
    toRight = toViewRight
    toLeft -= bias
  }
  if (toBottom < toViewBottom) {
    const bias = toViewBottom - toBottom
    toBottom = toViewBottom
    toTop -= bias
  }
  return { left: toLeft, right: toRight, top: toTop, bottom: toBottom }
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
  if (toTop < UI_CONFIG.HEADER_HEIGHT + toView.toViewTop) {
    const bias = UI_CONFIG.HEADER_HEIGHT + toView.toViewTop - toTop
    topOffset += bias
  }
  if (toLeft < UI_CONFIG.NAV_WIDTH + toView.toViewLeft + panelSize.left_width) {
    const bias = UI_CONFIG.NAV_WIDTH + toView.toViewLeft + panelSize.left_width - toLeft
    leftOffset += bias
  }
  if (toRight < toView.toViewRight + panelSize.right_width) {
    const bias = toView.toViewRight + panelSize.right_width - toRight
    leftOffset -= bias
  }
  if (toBottom < toView.toViewBottom) {
    const bias = toView.toViewBottom - toBottom
    topOffset -= bias
  }
  return { topOffset, leftOffset }
}

export function cPopSizeByCForFixed(
  pop: DOMRect,
  hover: DOMRect,
  toView: toView = { toViewTop: 8, toViewBottom: 8, toViewLeft: 8, toViewRight: 8 },
) {
  const topOffset = -(pop.height - hover.height) / 2
  const leftOffset = -(pop.width - hover.width) / 2
  let toLeft = hover.left + leftOffset
  let toTop = hover.top + topOffset
  const toBottom = window.innerHeight - toTop - pop.height
  const toRight = window.innerWidth - toLeft - pop.width
  if (toTop < UI_CONFIG.HEADER_HEIGHT + toView.toViewTop) {
    toTop = UI_CONFIG.HEADER_HEIGHT + toView.toViewTop
  }
  if (toLeft < UI_CONFIG.NAV_WIDTH + panelSize.left_width + toView.toViewLeft) {
    toLeft = UI_CONFIG.NAV_WIDTH + panelSize.left_width + toView.toViewLeft
  }
  if (toRight < toView.toViewRight) {
    const bias = toView.toViewRight - toRight
    toLeft -= bias
  }
  if (toBottom < toView.toViewBottom) {
    const bias = toView.toViewBottom - toBottom
    toTop -= bias
  }
  return { toTop, toLeft }
}
