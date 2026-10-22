import { ResizePanel } from '@renderer/components/resize-panel'
import { LeftPanel } from '@renderer/modules/panel/left-panel/panel'
import { panelSize } from '@renderer/state/global-var'
import { leftPanelOpenAtom, leftPanelResizingAtom, leftPanelWidth } from '@renderer/state/panel'
import { useAtom, useAtomValue } from 'jotai'
import { useEffect } from 'react'

export const LEFT_PANEL_MAX_WIDTH = 480
export const LEFT_PANEL_MIN_WIDTH = 248

export function LeftResizablePanel() {
  const open = useAtomValue(leftPanelOpenAtom)
  const [resizing, setResizing] = useAtom(leftPanelResizingAtom)
  const [width, setWidth] = useAtom(leftPanelWidth)
  useEffect(() => {
    panelSize.left_width = width
    if (!open) {
      panelSize.left_width = 0
    }
  }, [width, open])
  return (
    <ResizePanel
      maxWidth={LEFT_PANEL_MAX_WIDTH}
      minWidth={LEFT_PANEL_MIN_WIDTH}
      open={open}
      resizing={resizing}
      onResizing={setResizing}
      width={width}
      onWidthChange={setWidth}
      // Lists of links and episode controls, not text to read; selection only gets in the way.
      className="bg-background border-r select-none"
      resizeHandlePos="right"
    >
      <LeftPanel />
    </ResizePanel>
  )
}
