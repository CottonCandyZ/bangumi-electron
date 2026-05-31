import { openMonoListPanelTabAtomAction, type MonoListPanelTab } from '@renderer/state/panel'
import { useSetAtom } from 'jotai'
import { useCallback } from 'react'

export function useOpenMonoListPanelTab() {
  const openMonoListPanelTab = useSetAtom(openMonoListPanelTabAtomAction)

  return useCallback(
    (tab: MonoListPanelTab) => {
      openMonoListPanelTab(tab)
    },
    [openMonoListPanelTab],
  )
}
