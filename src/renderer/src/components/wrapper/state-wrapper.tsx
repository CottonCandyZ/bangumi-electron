import { createContext, PropsWithChildren, useRef } from 'react'
import { create } from 'zustand'

export const leftPanelSize = {
  width: 0,
}

type TabsFilter = {
  filter: Map<string, string>
  setFilter: (id: string, value: string) => void
}

export const useTabsFilter = create<TabsFilter>((set) => ({
  filter: new Map<string, string>(),
  setFilter: (id, value) => set((pre) => ({ filter: new Map(pre.filter).set(id, value) })),
}))

export const SateContext = createContext<{
  scrollCache: Map<string, number>
  otherCache: Map<string, Map<string, number | string>>
} | null>(null)

export default function InitStateContextWrapper({ children }: PropsWithChildren) {
  const scrollCache = useRef(new Map<string, number>())
  // 对于那些无法使用全局 zustand 的，使用一个初始化 Cache 配合一个自定义 hook src\renderer\src\hooks\cache-state.ts
  // 对于可以使用全局状态的则用上面的 create
  const otherCache = useRef(new Map<string, Map<string, number | string>>())

  return (
    <SateContext.Provider
      value={{ scrollCache: scrollCache.current, otherCache: otherCache.current }}
    >
      {children}
    </SateContext.Provider>
  )
}
