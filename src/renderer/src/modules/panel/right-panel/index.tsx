import { ResizableHandle, ResizablePanel } from '@renderer/components/ui/resizable'
import { useResizeObserver } from '@renderer/hooks/use-resize'
import { RightPanel } from '@renderer/modules/panel/right-panel/panel'
import { panelSize } from '@renderer/state/global-var'
import { rightPanelOpenAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import { useRef } from 'react'

export function RightResizablePanel() {
  const open = useAtomValue(rightPanelOpenAtom)
  const ref = useRef<HTMLDivElement>(null)
  useResizeObserver({
    ref,
    callback: (entry) => {
      panelSize.right_width = entry.target.getBoundingClientRect().width
    },
    deps: [open],
  })
  return (
    open && (
      <>
        <ResizableHandle className="w-0 border-r" />
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40} order={2} id="right">
          <div ref={ref} className="h-full">
            <RightPanel />
          </div>
        </ResizablePanel>
      </>
    )
  )
}