import { leftPanelHeaderSlotAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * 把左侧栏的工具条渲染到顶部栏左段（与 macOS 统一工具栏类似），
 * 顶部栏还没挂载时退回到原位渲染。
 */
export function LeftPanelHeaderPortal({ children }: { children: ReactNode }) {
  const slot = useAtomValue(leftPanelHeaderSlotAtom)
  if (!slot) return children
  return createPortal(children, slot)
}
