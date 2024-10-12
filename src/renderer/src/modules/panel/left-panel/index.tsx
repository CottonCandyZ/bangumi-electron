import { ResizePanel } from '@renderer/components/resize-panel'
import { LeftPanel } from '@renderer/modules/panel/left-panel/panel'
import { panelSize } from '@renderer/state/global-var'
import { leftPanelOpenAtom, leftPanelWidth } from '@renderer/state/panel'
import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'

const MAX_WIDTH = 480
const MIN_WIDTH = 248

export function LeftResizablePanel() {
  const open = useAtomValue(leftPanelOpenAtom)
  const [resizing, setResizing] = useState(false)
  const [width, setWidth] = useAtom(leftPanelWidth)
  useEffect(() => {
    panelSize.left_width = width
    if (!open) {
      panelSize.left_width = 0
    }
  }, [width, open])
  return (
    <ResizePanel
      maxWidth={MAX_WIDTH}
      minWidth={MIN_WIDTH}
      open={open}
      resizing={resizing}
      onResizing={setResizing}
      width={width}
      onWidthChange={setWidth}
      className="border-r bg-background"
      resizeHandlePos="right"
    >
      <LeftPanel />
    </ResizePanel>
  )
}
