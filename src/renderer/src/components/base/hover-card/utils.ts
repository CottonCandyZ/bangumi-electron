import { undefinedToZero } from '@renderer/lib/utils'
import { Align, Side } from '@renderer/type/ui'

export function calcPos({
  margin,
  collisionPadding,
  align,
  trigger,
  content,
}: {
  margin: number
  collisionPadding?: Partial<Record<Side, number>>
  align: Align
  trigger: DOMRect
  content: DOMRect
}) {
  // const toTop = trigger.top - margin - undefinedToZero(collisionPadding?.top)
  // const toLeft = trigger.left - undefinedToZero(collisionPadding?.left)
  const toBottom =
    window.innerHeight - trigger.bottom - margin - undefinedToZero(collisionPadding?.bottom)
  // const toRight = window.innerWidth - trigger.right - undefinedToZero(collisionPadding?.right)
  let bottom = true

  let X = 0,
    Y = 0
  if (align == 'start') {
    X = trigger.left
    if (X + content.width > window.innerWidth - undefinedToZero(collisionPadding?.right)) {
      X = window.innerWidth - content.width - undefinedToZero(collisionPadding?.right)
    }
  } else if (align === 'end') {
    X = trigger.left + trigger.width
  } else {
    X = trigger.left - (content.width - trigger.width) / 2
  }
  if (toBottom >= content.height) {
    // bottom
    Y = trigger.bottom + margin
  } else {
    // top
    bottom = false
    Y = trigger.top - margin - content.height
  }
  if (X < 0) {
    X = undefinedToZero(collisionPadding?.left)
  }
  if (X + content.width > window.innerWidth - undefinedToZero(collisionPadding?.right)) {
    X = window.innerWidth - content.width - undefinedToZero(collisionPadding?.right)
  }
  return { X, Y, bottom }
}
