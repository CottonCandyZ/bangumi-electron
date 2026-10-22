import { contextMenuAtom, type ContextMenuEntry } from '@renderer/state/context-menu'
import { useSetAtom } from 'jotai'
import { useCallback, type MouseEvent } from 'react'

let nextMenuId = 0

export const CONTEXT_MENU_SEPARATOR = { type: 'separator' } as const satisfies ContextMenuEntry

/**
 * 在鼠标位置打开全局右键菜单。
 * 内层元素先处理并阻止冒泡，所以嵌套时最具体的那一层生效。
 */
export function useContextMenu() {
  const setContextMenu = useSetAtom(contextMenuAtom)

  return useCallback(
    (event: MouseEvent, items: (ContextMenuEntry | false | null | undefined)[]) => {
      const entries = normalizeEntries(items)
      if (entries.length === 0) return
      // 选中了文字时把「复制」放在最前面，避免右键菜单盖掉复制选区
      const selection = window.getSelection()?.toString().trim()
      event.preventDefault()
      event.stopPropagation()
      setContextMenu({
        id: ++nextMenuId,
        items: selection
          ? [copySelectionEntry(selection), CONTEXT_MENU_SEPARATOR, ...entries]
          : entries,
        x: event.clientX,
        y: event.clientY,
      })
    },
    [setContextMenu],
  )
}

export function copySelectionEntry(text: string): ContextMenuEntry {
  return {
    label: '复制',
    icon: 'i-mingcute-copy-2-line',
    shortcut: 'c',
    onSelect: () => void navigator.clipboard.writeText(text),
  }
}

/** 去掉 false/空值，并合并多余的分隔线 */
function normalizeEntries(items: (ContextMenuEntry | false | null | undefined)[]) {
  const entries: ContextMenuEntry[] = []
  for (const item of items) {
    if (!item) continue
    if (
      item.type === 'separator' &&
      (entries.length === 0 || entries.at(-1)?.type === 'separator')
    ) {
      continue
    }
    entries.push(item)
  }
  if (entries.at(-1)?.type === 'separator') entries.pop()
  return entries
}
