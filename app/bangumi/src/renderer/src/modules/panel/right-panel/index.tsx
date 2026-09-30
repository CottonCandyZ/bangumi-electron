import { ResizePanel } from '@renderer/components/resize-panel'
import { RightPanel } from '@renderer/modules/panel/right-panel/panel'
import { panelSize } from '@renderer/state/global-var'
import {
  getRightPanelContentByPathname,
  rightPanelOpenAtom,
  rightPanelWidth,
} from '@renderer/state/panel'
import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const MAX_WIDTH = 480
const MIN_WIDTH = 248
const DEFAULT_WIDTH = 360

export function RightResizablePanel() {
  const desiredOpen = useAtomValue(rightPanelOpenAtom)
  const { pathname } = useLocation()
  const content = getRightPanelContentByPathname(pathname)
  const hasContent = content !== null
  const prevHasContentRef = useRef(hasContent)
  const routeContentStable = prevHasContentRef.current === hasContent
  const open = desiredOpen && hasContent
  const [resizing, setResizing] = useState(false)
  const [width, setWidth] = useAtom(rightPanelWidth)

  useEffect(() => {
    prevHasContentRef.current = hasContent
  }, [hasContent])

  useEffect(() => {
    panelSize.right_width = width
    if (!open) {
      panelSize.right_width = 0
    }
  }, [width, open])

  useEffect(() => {
    if (open && width < MIN_WIDTH) {
      setWidth(DEFAULT_WIDTH)
    }
  }, [open, setWidth, width])

  return (
    <ResizePanel
      maxWidth={MAX_WIDTH}
      minWidth={MIN_WIDTH}
      open={open}
      resizing={resizing}
      onResizing={setResizing}
      width={width}
      onWidthChange={setWidth}
      className="bg-background border-l"
      enableAnimation={hasContent && routeContentStable}
      resizeHandlePos="left"
    >
      <RightPanel content={content} />
    </ResizePanel>
  )
}
