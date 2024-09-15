import { ResizePanel } from '@renderer/components/resize-panel'
import { LeftPanel } from '@renderer/modules/panel/left-panel/panel'
import { panelSize } from '@renderer/state/global-var'
import { leftPanelOpenAtom, leftPanelWidth, triggerLeftOpenAtomAction } from '@renderer/state/panel'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'

const MAX_WIDTH = 480
const MIN_WIDTH = 248

export function LeftResizablePanel() {
  const open = useAtomValue(leftPanelOpenAtom)
  const triggerOpen = useSetAtom(triggerLeftOpenAtomAction)
  const [resizing, setResizing] = useState(false)
  const [width, setWidth] = useAtom(leftPanelWidth)
  useEffect(() => {
    panelSize.left_width = width
    if (!open) {
      panelSize.left_width = 0
    }
  }, [width, open])
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
    <ResizePanel
      maxWidth={MAX_WIDTH}
      minWidth={MIN_WIDTH}
      open={open}
      resizing={resizing}
      onResizing={setResizing}
      width={width}
      onWidthChange={setWidth}
      className="border-r"
      resizeHandlePos="right"
    >
      <LeftPanel />
    </ResizePanel>
  )
}
