// 放置 zustand 构建的全局 hook 包装

import { useTabsFilter } from '@renderer/components/wrapper/state-wrapper'

export const useTabFilterHook = ({ id, placeHolder }: { id: string; placeHolder: string }) => {
  const { filter, setFilter } = useTabsFilter((state) => state)
  const currentFilter = filter.get(id) ?? placeHolder
  return { filter: currentFilter, setFilter }
}
