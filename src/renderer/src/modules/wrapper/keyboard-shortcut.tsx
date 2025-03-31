import { useSetAtom } from 'jotai'
import { useHotkeys } from 'react-hotkeys-hook'
import { triggerLeftOpenAtomAction } from '@renderer/state/panel'

export const useGlobalKeyboard = () => {
  const toggleLeftSidePanel = useSetAtom(triggerLeftOpenAtomAction)
  useHotkeys('mod+b', () => {
    toggleLeftSidePanel()
  })
}
