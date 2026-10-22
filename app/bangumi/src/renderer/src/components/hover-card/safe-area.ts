/**
 * 悬停卡片的「安全三角区」：鼠标离开触发器后，只要还在
 * 「离开点 → 卡片最近一条边」构成的三角形里移动，就认为用户正往卡片走，
 * 期间经过的其他触发器不会抢走卡片，卡片也不会关闭（参考 context menu 子菜单的做法）。
 */

type Point = { x: number; y: number }

/** 鼠标在三角区内停住超过这个时间，就当作不再往卡片走 */
const SAFE_AREA_IDLE_TIMEOUT = 300
/** 停在别的触发器上时更快切过去：往卡片走的鼠标几乎不会在中途停顿 */
const SAFE_AREA_PENDING_IDLE_TIMEOUT = 80

let contentElement: HTMLElement | null = null
let safeArea: {
  close: () => void
  keepOpen: () => void
  /** 开启安全区的那个触发器 */
  owner: object
  apex: Point
  trigger: DOMRect
  last: Point
  /** 鼠标在触发器正对卡片的那条缝里：几乎肯定是在往卡片走 */
  inBridge: boolean
  idleTimer: ReturnType<typeof setTimeout>
  pending: (() => void) | null
} | null = null

export function setHoverCardContentElement(element: HTMLElement | null) {
  contentElement = element
}

export function clearHoverCardContentElement(element: HTMLElement | null) {
  if (contentElement === element) contentElement = null
}

export function isInHoverCardSafeArea() {
  return safeArea !== null
}

export function isHoverCardContent(target: EventTarget | null) {
  return !!contentElement && target instanceof Node && contentElement.contains(target)
}

/**
 * 安全区内进入触发器时调用。回到开启安全区的那个触发器：直接结束安全区并保持卡片；
 * 其他触发器：把打开动作挂起，等离开安全区时再执行。
 */
export function enterHoverCardTriggerInSafeArea(owner: object, enter: () => void) {
  if (!safeArea) return
  if (safeArea.owner === owner) {
    safeArea.pending = null
    endSafeArea(true)
  } else {
    safeArea.pending = enter
    restartIdleTimer()
  }
}

function restartIdleTimer() {
  if (!safeArea) return
  clearTimeout(safeArea.idleTimer)
  safeArea.idleTimer = setTimeout(
    () => endSafeArea(false),
    safeArea.pending && !safeArea.inBridge
      ? SAFE_AREA_PENDING_IDLE_TIMEOUT
      : SAFE_AREA_IDLE_TIMEOUT,
  )
}

/** 从触发器离开时调用；卡片不存在时返回 false，由调用方按原逻辑关闭 */
export function startHoverCardSafeArea(
  exit: Point,
  {
    close,
    keepOpen,
    owner,
    trigger,
  }: { close: () => void; keepOpen: () => void; owner: object; trigger: DOMRect },
) {
  if (!contentElement) return false
  endSafeArea()
  // 三角形的顶点放回触发器中心一侧：快速移动时 mouseleave 报出的位置可能已经
  // 越过触发器、贴着卡片边缘，以它为顶点三角形会被压扁成一条线，轻微抖动就会出界
  const apex = {
    x: clamp(exit.x, trigger.left, trigger.right),
    y: clamp(exit.y, trigger.top, trigger.bottom),
  }
  const center = { x: (trigger.left + trigger.right) / 2, y: (trigger.top + trigger.bottom) / 2 }
  safeArea = {
    close,
    keepOpen,
    owner,
    apex: { x: (apex.x + center.x) / 2, y: (apex.y + center.y) / 2 },
    trigger,
    last: exit,
    inBridge: false,
    idleTimer: setTimeout(() => endSafeArea(false), SAFE_AREA_IDLE_TIMEOUT),
    pending: null,
  }
  document.addEventListener('pointermove', onPointerMove, true)
  return true
}

function onPointerMove(event: PointerEvent) {
  if (!safeArea || !contentElement) return endSafeArea(false)
  const point = { x: event.clientX, y: event.clientY }
  const rect = contentElement.getBoundingClientRect()
  if (isInRect(point, rect)) return endSafeArea(true)
  const inBridge = isInRect(point, bridgeRect(safeArea.trigger, rect))
  if (!inBridge && !isInTriangle(point, safeArea.apex, ...nearestEdge(safeArea.apex, rect))) {
    return endSafeArea(false)
  }
  // 明显在远离卡片：是想去别的触发器，立即切换
  if (isMovingAway(safeArea.last, point, rect)) return endSafeArea(false)
  safeArea.last = point
  safeArea.inBridge = inBridge
  restartIdleTimer()
}

function isMovingAway(from: Point, to: Point, rect: DOMRect) {
  const target = {
    x: clamp(from.x, rect.left, rect.right),
    y: clamp(from.y, rect.top, rect.bottom),
  }
  const toward = { x: target.x - from.x, y: target.y - from.y }
  const move = { x: to.x - from.x, y: to.y - from.y }
  const length = Math.hypot(toward.x, toward.y) * Math.hypot(move.x, move.y)
  // 夹角大于 120° 才算远离，横着走或略带抖动都不算
  return length > 0 && (toward.x * move.x + toward.y * move.y) / length < -0.5
}

function endSafeArea(reachedContent = false) {
  if (!safeArea) return
  const { close, idleTimer, keepOpen, pending } = safeArea
  clearTimeout(idleTimer)
  document.removeEventListener('pointermove', onPointerMove, true)
  safeArea = null
  // 到达卡片：卡片可能是直接出现在鼠标下面的，收不到 mouseenter，这里显式保持打开
  if (reachedContent) return keepOpen()
  // The pointer may already have left the pending trigger, making its callback a no-op.
  // Always schedule closing first; opening a still-hovered trigger cancels that close.
  close()
  pending?.()
}

type Rect = Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>

function isInRect(point: Point, rect: Rect) {
  return (
    point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
  )
}

/**
 * 触发器正对着卡片的那条缝。剧集按钮排得很密，这条缝里往往露着下一行按钮的边，
 * 鼠标经过时也算在往卡片走；只取触发器自身的宽度，不影响横向切到相邻的按钮
 */
function bridgeRect(trigger: DOMRect, card: DOMRect): Rect {
  const pad = 4
  const horizontal = { left: trigger.left - pad, right: trigger.right + pad }
  if (card.top >= trigger.bottom - 1) {
    return { ...horizontal, top: trigger.bottom, bottom: card.top }
  }
  if (card.bottom <= trigger.top + 1) {
    return { ...horizontal, top: card.bottom, bottom: trigger.top }
  }
  const vertical = { top: trigger.top - pad, bottom: trigger.bottom + pad }
  if (card.left >= trigger.right - 1) return { ...vertical, left: trigger.right, right: card.left }
  return { ...vertical, left: card.right, right: trigger.left }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/** 卡片上离离开点最近的那条边的两个端点（稍微外扩一点，斜着走也不会擦边出界） */
function nearestEdge(exit: Point, rect: DOMRect): [Point, Point] {
  const pad = 8
  if (exit.y <= rect.top) {
    return [
      { x: rect.left - pad, y: rect.top },
      { x: rect.right + pad, y: rect.top },
    ]
  }
  if (exit.y >= rect.bottom) {
    return [
      { x: rect.left - pad, y: rect.bottom },
      { x: rect.right + pad, y: rect.bottom },
    ]
  }
  const x = exit.x <= rect.left ? rect.left : rect.right
  return [
    { x, y: rect.top - pad },
    { x, y: rect.bottom + pad },
  ]
}

function isInTriangle(point: Point, a: Point, b: Point, c: Point) {
  const cross = (p1: Point, p2: Point, p3: Point) =>
    (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
  const d1 = cross(point, a, b)
  const d2 = cross(point, b, c)
  const d3 = cross(point, c, a)
  const hasNegative = d1 < 0 || d2 < 0 || d3 < 0
  const hasPositive = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNegative && hasPositive)
}
