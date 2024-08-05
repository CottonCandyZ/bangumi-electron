import LeftPanel from '@renderer/components/panel/left-panel/panel'
import { ResizableHandle, ResizablePanel } from '@renderer/components/ui/resizable'
import { useResizeOb } from '@renderer/hooks/resize'
import { panelSize } from '@renderer/state/global-var'
import { leftPanelOpenAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import { useRef } from 'react'

export default function LeftResizablePanel() {
  const open = useAtomValue(leftPanelOpenAtom)
  const ref = useRef<HTMLDivElement>(null)
  useResizeOb({
    ref,
    callback: (entries) => {
      panelSize.left_width = entries[0].target.getBoundingClientRect().width
    },
  })
  return (
    open && (
      <>
        <ResizablePanel
          defaultSize={25}
          minSize={20}
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
