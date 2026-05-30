import { SearchParam } from '@renderer/data/types/search'
import { useOpenMonoListPanelTab } from '@renderer/modules/panel/left-panel/use-open-mono-list-panel-tab'
import { useCallback } from 'react'

export function useOpenTagSearchPanel() {
  const openMonoListPanelTab = useOpenMonoListPanelTab()

  return useCallback(
    (tag: string) => {
      const normalizedTag = tag.trim()
      if (!normalizedTag) return

      const searchParam = {
        sort: 'heat',
        filter: {
          tag: [normalizedTag],
        },
      } satisfies SearchParam
      const searchParams = new URLSearchParams()
      searchParams.append('tag', normalizedTag)
      searchParams.set('sort', 'heat')

      openMonoListPanelTab({
        id: `search-tag-${normalizedTag}`,
        type: 'searchSubjects',
        title: `标签 · ${normalizedTag}`,
        sourceTitle: '标签搜索',
        sourceTo: `/search?${searchParams.toString()}`,
        searchParam,
      })
    },
    [openMonoListPanelTab],
  )
}
