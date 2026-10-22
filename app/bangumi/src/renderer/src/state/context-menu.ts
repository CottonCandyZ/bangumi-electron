import { atom } from 'jotai'
import type { NavigateFunction } from 'react-router-dom'

export type ContextMenuActionHelpers = {
  navigate: NavigateFunction
}

export type ContextMenuEntry =
  | {
      type?: 'item'
      label: string
      /** iconify 类名，例如 i-mingcute-copy-2-line */
      icon?: string
      /** 菜单打开时按下这个单键直接执行（显示在菜单项右侧） */
      shortcut?: string
      variant?: 'default' | 'destructive'
      disabled?: boolean
      onSelect: (helpers: ContextMenuActionHelpers) => void
    }
  | { type: 'separator' }
  /** 条目收藏状态子菜单，菜单打开时按 1~5 直接标记 */
  | { type: 'subject-collection'; subjectId: number }
  /** 角色 / 人物的收藏开关 */
  | { type: 'resource-collection'; resourceType: 'character' | 'person'; resourceId: number }

export type ContextMenuState = {
  /** 每次打开递增，用来让菜单在新位置重新定位 */
  id: number
  items: ContextMenuEntry[]
  x: number
  y: number
}

export const contextMenuAtom = atom<ContextMenuState | null>(null)
