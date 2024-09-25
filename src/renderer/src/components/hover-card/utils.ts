import { Align, Side } from '@renderer/type/ui'
import { clamp } from '@renderer/lib/utils/tool'

type VerticalPlacement = 'top' | 'bottom'
type HorizontalPlacement = 'left' | 'right'

type VerticalResult = {
  X: number
  top: number | undefined
  bottom: number | undefined
  height: number | undefined
}

type HorizontalResult = {
  Y: number
  left: number | undefined
  right: number | undefined
  width: number | undefined
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

  let X: number
  let top: number | undefined
  let bottom: number | undefined
  let height: number | undefined

  // Calculate X position
  switch (align) {
    case 'start':
      X = clamp(trigger.left, paddingLeft, window.innerWidth - content.width - paddingRight)
      break
    case 'end':
      X = clamp(
        trigger.right - content.width,
        paddingLeft,
        window.innerWidth - content.width - paddingRight,
      )
      break
    default: // center
      X = clamp(
        trigger.left + (trigger.width - content.width) / 2,
        paddingLeft,
        window.innerWidth - content.width - paddingRight,
      )
  }

  // Calculate vertical position
  const preferBottom = preferredPlacement === 'bottom'
  const spacePreferred = preferBottom ? toBottom : toTop
  const spaceOpposite = preferBottom ? toTop : toBottom

  if (spacePreferred >= content.height) {
    if (preferBottom) top = trigger.bottom + margin
    else bottom = window.innerHeight - trigger.top + margin
  } else if (spaceOpposite >= content.height) {
    if (preferBottom) bottom = window.innerHeight - trigger.top + margin
    else top = trigger.bottom + margin
  } else {
    const usePreferred = spacePreferred > spaceOpposite
    top = usePreferred === preferBottom ? trigger.bottom + margin : undefined
    bottom = usePreferred === preferBottom ? undefined : window.innerHeight - trigger.top + margin
    height = usePreferred ? spacePreferred : spaceOpposite
  }

  return { X, top, bottom, height }
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

  let Y: number
  let left: number | undefined
  let right: number | undefined
  let width: number | undefined

  // Calculate Y position
  switch (align) {
    case 'start':
      Y = clamp(trigger.top, paddingTop, window.innerHeight - content.height - paddingBottom)
      break
    case 'end':
      Y = clamp(
        trigger.bottom - content.height,
        paddingTop,
        window.innerHeight - content.height - paddingBottom,
      )
      break
    default: // center
      Y = clamp(
        trigger.top + (trigger.height - content.height) / 2,
        paddingTop,
        window.innerHeight - content.height - paddingBottom,
      )
  }

  // Ensure Y is within bounds
  Y = clamp(Y, paddingTop, window.innerHeight - content.height - paddingBottom)

  // Calculate horizontal position
  const preferRight = preferredPlacement === 'right'
  const spacePreferred = preferRight ? toRight : toLeft
  const spaceOpposite = preferRight ? toLeft : toRight

  if (spacePreferred >= content.width) {
    if (preferRight) left = trigger.right + margin
    else right = window.innerWidth - trigger.left + margin
  } else if (spaceOpposite >= content.width) {
    if (preferRight) right = window.innerWidth - trigger.left + margin
    else left = trigger.right + margin
  } else {
    const usePreferred = spacePreferred > spaceOpposite
    left = usePreferred === preferRight ? trigger.right + margin : undefined
    right = usePreferred === preferRight ? undefined : window.innerWidth - trigger.left + margin
    width = usePreferred ? spacePreferred : spaceOpposite
  }

  return { Y, left, right, width }
}
