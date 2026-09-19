import { useLayoutEffect, useState } from 'react'
import type { Dialog } from '@base-ui/react/dialog'

type LifecycleProps = Pick<
  Dialog.Root.Props,
  'open' | 'defaultOpen' | 'children' | 'onOpenChange' | 'onOpenChangeComplete'
>

/** Keep the last open render while Base UI plays its exit animation.
 * Parents may clear payloads or reset forms immediately on close. Release the
 * snapshot on animation completion, not after a guessed timeout. Keep the root
 * mounted and change `open` so the primitive can finish its focus/exit lifecycle.
 * This retains parent-provided props, not independent state inside descendants.
 */
export function useDialogExitRetention({
  open,
  defaultOpen = false,
  children,
  onOpenChange,
  onOpenChangeComplete,
}: LifecycleProps): LifecycleProps {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isOpen = open ?? uncontrolledOpen
  const [snapshot, setSnapshot] = useState<{ children: LifecycleProps['children'] } | null>(null)

  useLayoutEffect(() => {
    if (isOpen) setSnapshot({ children })
  }, [isOpen, children])

  return {
    children: !isOpen && snapshot ? snapshot.children : children,
    onOpenChange(nextOpen, details) {
      onOpenChange?.(nextOpen, details)
      if (!details.isCanceled) setUncontrolledOpen(nextOpen)
    },
    onOpenChangeComplete(nextOpen) {
      if (!nextOpen && !isOpen) setSnapshot(null)
      onOpenChangeComplete?.(nextOpen)
    },
  }
}
