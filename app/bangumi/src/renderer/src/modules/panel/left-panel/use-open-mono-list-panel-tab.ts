import { openMonoListPanelTabAtomAction, type MonoListPanelTab } from '@renderer/state/panel'
import { store } from '@renderer/state/utils'
import { useCallback } from 'react'

export function useOpenMonoListPanelTab() {
  return useCallback((tab: MonoListPanelTab) => {
    store.set(openMonoListPanelTabAtomAction, tab)
  }, [])
}
