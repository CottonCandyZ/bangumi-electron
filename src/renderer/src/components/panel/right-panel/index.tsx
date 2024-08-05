import RightPanel from '@renderer/components/panel/right-panel/panel'
import { ResizableHandle, ResizablePanel } from '@renderer/components/ui/resizable'
import { useResizeOb } from '@renderer/hooks/resize'
import { panelSize } from '@renderer/state/global-var'
import { rightPanelOpenAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import { useRef } from 'react'

export default function RightResizablePanel() {
  const open = useAtomValue(rightPanelOpenAtom)
  const ref = useRef<HTMLDivElement>(null)
  useResizeOb({
    ref,
    callback: (entries) => {
      panelSize.right_width = entries[0].target.getBoundingClientRect().width
    },
  })
  return (
    open && (
      <>
        <ResizableHandle className="w-0 border-r" />
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} order={2} id="right">
          <div ref={ref} className="flex">
            <RightPanel />
          </div>
        </ResizablePanel>
      </>
    )
  )
}
