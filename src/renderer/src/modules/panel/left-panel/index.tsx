import { ResizableHandle, ResizablePanel } from '@renderer/components/ui/resizable'
import { useResizeObserver } from '@renderer/hooks/use-resize'
import { LeftPanel } from '@renderer/modules/panel/left-panel/panel'
import { panelSize } from '@renderer/state/global-var'
import {
  leftPanelOpenAtom,
  leftPanelSizeAtom,
  triggerLeftOpenAtomAction,
} from '@renderer/state/panel'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useRef } from 'react'

export function LeftResizablePanel() {
  const open = useAtomValue(leftPanelOpenAtom)
  const triggerOpen = useSetAtom(triggerLeftOpenAtomAction)
  const ref = useRef<HTMLDivElement>(null)
  const setLeftPanelSize = useSetAtom(leftPanelSizeAtom)
  useResizeObserver({
    ref,
    callback: (entry) => {
      panelSize.left_width = entry.target.getBoundingClientRect().width
      setLeftPanelSize(entry.target.getBoundingClientRect().width)
    },
    deps: [open],
  })
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        triggerOpen()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  })
  return (
    open && (
      <>
        <ResizablePanel
          defaultSize={25}
          minSize={15}
          maxSize={70}
          order={1}
          id="list"
          className="min-w-64"
        >
          <div ref={ref}>
            <LeftPanel />
          </div>
        </ResizablePanel>
        <ResizableHandle className="w-0 border-r" />
      </>
    )
  )
}
