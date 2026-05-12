import { SearchParam } from '@renderer/data/types/search'
import { openMonoListPanelTabAtomAction } from '@renderer/state/panel'
import { useSetAtom } from 'jotai'
import { useCallback } from 'react'

export function useOpenTagSearchPanel() {
  const openMonoListPanelTab = useSetAtom(openMonoListPanelTabAtomAction)

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
