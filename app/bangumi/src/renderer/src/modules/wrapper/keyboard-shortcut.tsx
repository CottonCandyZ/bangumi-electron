import { useAtomValue, useSetAtom } from 'jotai'
import { useHotkeys } from 'react-hotkeys-hook'
import { triggerLeftOpenAtomAction } from '@renderer/state/panel'
import { useNavigate } from 'react-router-dom'
import { appConfigAtom } from '@renderer/state/app-config'
import { getHotkeyForHook, isHotkeyEnabled } from '@renderer/lib/shortcut'

function KeyboardShortcutWrapper({ children }: { children: React.ReactNode }) {
  const toggleLeftSidePanel = useSetAtom(triggerLeftOpenAtomAction)
  const shortcuts = useAtomValue(appConfigAtom).shortcuts
  const navigate = useNavigate()

  useHotkeys(
    getHotkeyForHook(shortcuts.toggleLeftPanel),
    () => {
      toggleLeftSidePanel()
    },
    { enabled: isHotkeyEnabled(shortcuts.toggleLeftPanel) },
    [shortcuts.toggleLeftPanel],
  )

  useHotkeys(
    getHotkeyForHook(shortcuts.openSettings),
    (event) => {
      event.preventDefault()
      navigate('/settings')
    },
    {
      enableOnFormTags: true,
      enabled: isHotkeyEnabled(shortcuts.openSettings),
      preventDefault: true,
    },
    [navigate, shortcuts.openSettings],
  )

  return <>{children}</>
}

export { KeyboardShortcutWrapper }
