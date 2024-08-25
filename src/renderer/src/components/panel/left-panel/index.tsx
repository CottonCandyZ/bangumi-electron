import LeftPanel from '@renderer/components/panel/left-panel/panel'
import { ResizableHandle, ResizablePanel } from '@renderer/components/ui/resizable'
import { useResizeOb } from '@renderer/hooks/resize'
import { panelSize } from '@renderer/state/global-var'
import { leftPanelOpenAtom } from '@renderer/state/panel'
import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'

export default function LeftResizablePanel() {
  const [open, setOpen] = useAtom(leftPanelOpenAtom)
  const ref = useRef<HTMLDivElement>(null)
  useResizeOb({
    ref,
    callback: (entries) => {
      panelSize.left_width = entries[0].target.getBoundingClientRect().width
    },
    deps: [open],
  })
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
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
