import {
  closeAllMonoListPanelTabsAtomAction,
  closeMonoListPanelTabAtomAction,
  monoListPanelActiveTabIdAtom,
  monoListPanelTabsAtom,
} from '@renderer/state/panel'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { MonoListPanelContent } from './mono-list-panel/content-router'
import { useMonoListPanelFilters } from './mono-list-panel/filter-visibility'
import { MonoListPanelHeader } from './mono-list-panel/panel-header'

export function MonoListPanel() {
  const tabs = useAtomValue(monoListPanelTabsAtom)
  const [activeTabId, setActiveTabId] = useAtom(monoListPanelActiveTabIdAtom)
  const closeTab = useSetAtom(closeMonoListPanelTabAtomAction)
  const closeAllTabs = useSetAtom(closeAllMonoListPanelTabsAtomAction)
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const { canToggleFilters, filtersOpen, toggleFilters } = useMonoListPanelFilters(activeTab)

  useEffect(() => {
    if (!activeTabId && activeTab) setActiveTabId(activeTab.id)
  }, [activeTab, activeTabId, setActiveTabId])

  if (!activeTab) return null

  return (
    <div className="flex h-dvh min-w-0 flex-col">
      <MonoListPanelHeader
        activeTab={activeTab}
        canToggleFilters={canToggleFilters}
        closeAllTabs={closeAllTabs}
        closeTab={closeTab}
        filtersOpen={filtersOpen}
        setActiveTabId={setActiveTabId}
        tabs={tabs}
        toggleFilters={toggleFilters}
      />
      <MonoListPanelContent filtersOpen={filtersOpen} tab={activeTab} />
    </div>
  )
}
