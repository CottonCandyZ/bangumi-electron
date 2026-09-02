import type { MonoListPanelTab } from '@renderer/state/panel'
import { useState } from 'react'

export function useMonoListPanelFilters(activeTab: MonoListPanelTab | undefined) {
  const [filterTabIdsOpen, setFilterTabIdsOpen] = useState<Set<string>>(() => new Set())
  const activeTabId = activeTab?.id
  const filtersOpen = activeTabId ? filterTabIdsOpen.has(activeTabId) : false
  const canToggleFilters = activeTab ? monoListPanelTabHasFilters(activeTab) : false
  const toggleFilters = () => {
    if (!activeTabId) return
    setFilterTabIdsOpen((current) => toggleSetItem(current, activeTabId))
  }

  return { canToggleFilters, filtersOpen, toggleFilters }
}

function toggleSetItem(current: Set<string>, item: string) {
  const next = new Set(current)
  if (next.has(item)) next.delete(item)
  else next.add(item)
  return next
}

function monoListPanelTabHasFilters(tab: MonoListPanelTab) {
  return (
    tab.type === 'subjects' ||
    tab.type === 'related' ||
    tab.type === 'subjectCharacters' ||
    tab.type === 'subjectRelated' ||
    tab.type === 'indexRelated'
  )
}
