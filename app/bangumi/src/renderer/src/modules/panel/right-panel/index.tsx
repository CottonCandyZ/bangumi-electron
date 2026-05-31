import { ResizePanel } from '@renderer/components/resize-panel'
import { RightPanel } from '@renderer/modules/panel/right-panel/panel'
import { panelSize } from '@renderer/state/global-var'
import {
  getRightPanelContentByPathname,
  replyComposerAtom,
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
  const replyComposer = useAtomValue(replyComposerAtom)
  const { pathname } = useLocation()
  const content = replyComposer.open ? 'replyComposer' : getRightPanelContentByPathname(pathname)
  const hasContent = content !== null
  const prevContentRef = useRef<typeof content>(content)
  const prevHasContentRef = useRef(hasContent)
  const isReplyComposerTransition =
    content === 'replyComposer' || prevContentRef.current === 'replyComposer'
  const routeContentStable = isReplyComposerTransition || prevHasContentRef.current === hasContent
  const open = desiredOpen && hasContent
  const [resizing, setResizing] = useState(false)
  const [width, setWidth] = useAtom(rightPanelWidth)

  useEffect(() => {
    prevContentRef.current = content
    prevHasContentRef.current = hasContent
  }, [content, hasContent])

  useEffect(() => {
    panelSize.right_width = width
    if (!open) {
      panelSize.right_width = 0
    }
  }, [width, open])

  useEffect(() => {
    if (open && width <= MIN_WIDTH) {
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
      enableAnimation={
        (hasContent || prevContentRef.current === 'replyComposer') && routeContentStable
      }
      resizeHandlePos="left"
    >
      <RightPanel content={content} />
    </ResizePanel>
  )
}
