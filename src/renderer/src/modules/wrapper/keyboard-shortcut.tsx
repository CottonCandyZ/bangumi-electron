import { triggerLeftOpenAtomAction } from '@renderer/state/panel'
import { useSetAtom } from 'jotai'
import { PropsWithChildren, useEffect } from 'react'

export const KeyboardShortcutProvider = ({ children }: PropsWithChildren) => {
  const triggerLeftPanelOpen = useSetAtom(triggerLeftOpenAtomAction)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // leftPanel
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        triggerLeftPanelOpen()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [triggerLeftPanelOpen])
  return children
}
