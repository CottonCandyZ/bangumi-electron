import { useSetAtom } from 'jotai'
import { useHotkeys } from 'react-hotkeys-hook'
import { triggerLeftOpenAtomAction } from '@renderer/state/panel'

function KeyboardShortcutWrapper({ children }: { children: React.ReactNode }) {
  const toggleLeftSidePanel = useSetAtom(triggerLeftOpenAtomAction)
  useHotkeys('mod+b', () => {
    toggleLeftSidePanel()
  })
  return <>{children}</>
}

export { KeyboardShortcutWrapper }
