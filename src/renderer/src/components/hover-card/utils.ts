import { Align, Side } from '@renderer/type/ui'
import { clamp } from '@renderer/lib/utils/tool'

type VerticalPlacement = 'top' | 'bottom'
type HorizontalPlacement = 'left' | 'right'

type VerticalResult = {
  left: number
  top: number
  bottom: number
  right: number
  collision: boolean
  isBottom: boolean
}

type HorizontalResult = {
  left: number
  top: number
  bottom: number
  right: number
  collision: boolean
  isRight: boolean
}

type CalcPosParams = {
  margin: number
  collisionPadding?: Partial<Record<Side, number>>
  align: Align
  trigger: DOMRect
  content: DOMRect
  preferredPlacement?: Placement
}

type Placement = 'top' | 'bottom' | 'left' | 'right'

type CalcPosResult<T extends Placement | undefined> = T extends 'left' | 'right'
  ? HorizontalResult
  : VerticalResult

export function calcPos<T extends Placement | undefined = 'bottom'>({
  margin,
  collisionPadding = {},
  align,
  trigger,
  content,
  preferredPlacement,
}: CalcPosParams & { preferredPlacement?: T }): CalcPosResult<T> {
  const placement = preferredPlacement || 'bottom'
  const {
    top: paddingTop = 0,
    bottom: paddingBottom = 0,
    left: paddingLeft = 0,
    right: paddingRight = 0,
  } = collisionPadding

  if (placement === 'left' || placement === 'right') {
    return calcHorizontalPos({
      margin,
      paddingTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
      align,
      trigger,
      content,
      preferredPlacement: placement,
    }) as CalcPosResult<T>
  } else {
    return calcVerticalPos({
      margin,
      paddingTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
      align,
      trigger,
      content,
      preferredPlacement: placement,
    }) as CalcPosResult<T>
  }
}

function calcVerticalPos({
  margin,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  align,
  trigger,
  content,
  preferredPlacement,
}: Omit<CalcPosParams, 'collisionPadding' | 'preferredPlacement'> & {
  paddingTop: number
  paddingBottom: number
  paddingLeft: number
  paddingRight: number
  preferredPlacement: VerticalPlacement
}): VerticalResult {
  const toTop = trigger.top - margin - paddingTop
  const toBottom = window.innerHeight - trigger.bottom - margin - paddingBottom

  let left: number

  // left
  switch (align) {
    case 'start':
      left = clamp(trigger.left, paddingLeft, window.innerWidth - content.width - paddingRight)
      break
    case 'end':
      left = clamp(
        trigger.right - content.width,
        paddingLeft,
        window.innerWidth - content.width - paddingRight,
      )
      break
    default: // center
      left = clamp(
        trigger.left + (trigger.width - content.width) / 2,
        paddingLeft,
        window.innerWidth - content.width - paddingRight,
      )
  }

  const right = window.innerWidth - left - content.width

  let top: number
  let bottom: number
  let collision = false

  // Calculate vertical position
  const preferBottom = preferredPlacement === 'bottom'
  const spacePreferred = preferBottom ? toBottom : toTop
  const spaceOpposite = preferBottom ? toTop : toBottom
  let isBottom = true
  if (spacePreferred >= content.height) {
    isBottom = preferBottom
  } else if (spaceOpposite >= content.height) {
    isBottom = !preferBottom
  } else {
    // 折叠
    const usePreferred = spacePreferred > spaceOpposite
    isBottom = usePreferred === preferBottom
    collision = true
  }

  if (isBottom) {
    top = trigger.bottom + margin
    bottom = collision ? paddingBottom : window.innerHeight - top - content.height
  } else {
    bottom = window.innerHeight - trigger.top + margin
    top = collision ? paddingTop : window.innerHeight - bottom - content.height
  }

  return { left, top, bottom, right, collision, isBottom }
}

function calcHorizontalPos({
  margin,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  align,
  trigger,
  content,
  preferredPlacement,
}: Omit<CalcPosParams, 'collisionPadding' | 'preferredPlacement'> & {
  paddingTop: number
  paddingBottom: number
  paddingLeft: number
  paddingRight: number
  preferredPlacement: HorizontalPlacement
}): HorizontalResult {
  const toLeft = trigger.left - margin - paddingLeft
  const toRight = window.innerWidth - trigger.right - margin - paddingRight

  let top: number

  // Calculate Y position
  switch (align) {
    case 'start':
      top = clamp(trigger.top, paddingTop, window.innerHeight - content.height - paddingBottom)
      break
    case 'end':
      top = clamp(
        trigger.bottom - content.height,
        paddingTop,
        window.innerHeight - content.height - paddingBottom,
      )
      break
    default: // center
      top = clamp(
        trigger.top + (trigger.height - content.height) / 2,
        paddingTop,
        window.innerHeight - content.height - paddingBottom,
      )
  }
  const bottom = window.innerHeight - top - content.height

  let left: number
  let right: number
  let collision = false

  // Calculate horizontal position
  const preferRight = preferredPlacement === 'right'
  const spacePreferred = preferRight ? toRight : toLeft
  const spaceOpposite = preferRight ? toLeft : toRight

  let isRight = true
  if (spacePreferred >= content.width) {
    isRight = preferRight
  } else if (spaceOpposite >= content.width) {
    isRight = !preferRight
  } else {
    // 折叠
    const usePreferred = spacePreferred > spaceOpposite
    isRight = usePreferred === preferRight
    collision = true
  }

  if (isRight) {
    left = trigger.right + margin
    right = collision ? paddingRight : window.innerWidth - left - content.width
  } else {
    right = window.innerWidth - trigger.left + margin
    left = collision ? paddingLeft : window.innerHeight - right - content.width
  }

  return { top, left, right, bottom, isRight, collision }
}
