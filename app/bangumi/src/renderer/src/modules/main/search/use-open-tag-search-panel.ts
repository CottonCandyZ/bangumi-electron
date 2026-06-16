import { SearchParam } from '@renderer/data/types/search'
import { useOpenMonoListPanel } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import { useCallback } from 'react'

export function useOpenTagSearchPanel() {
  const openMonoListPanel = useOpenMonoListPanel()

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

      openMonoListPanel({
        id: `search-tag-${normalizedTag}`,
        type: 'searchSubjects',
        title: `标签 · ${normalizedTag}`,
        sourceTitle: '标签搜索',
        sourceTo: `/search?${searchParams.toString()}`,
        searchParam,
      })
    },
    [openMonoListPanel],
  )
}
