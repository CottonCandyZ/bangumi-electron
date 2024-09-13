// from https://github.com/toeverything/AFFiNE/blob/ae3f48d0cc8083693f0ac1bdab3dfc79e95ae511/packages/frontend/component/src/components/resize-panel/resize-panel.tsx

import { cn } from '@renderer/lib/utils'
import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTransition } from 'react-transition-state'

export interface ResizeHandleProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  resizing: boolean
  open: boolean
  minWidth: number
  maxWidth: number
  resizeHandlePos: 'left' | 'right'
  resizeHandleOffset?: number
  resizeHandleVerticalPadding?: number
  onOpen: (open: boolean) => void
  onResizing: (resizing: boolean) => void
  onWidthChange: (width: number) => void
}

export interface ResizePanelProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  resizing: boolean
  open: boolean
  floating?: boolean
  minWidth: number
  maxWidth: number
  resizeHandlePos: 'left' | 'right'
  resizeHandleOffset?: number
  resizeHandleVerticalPadding?: number
  enableAnimation?: boolean
  width: number
  unmountOnExit?: boolean
  onOpen: (open: boolean) => void
  onResizing: (resizing: boolean) => void
  onWidthChange: (width: number) => void
}

// delay initial animation to avoid flickering
function useEnableAnimation() {
  const [enable, setEnable] = useState(false)
  useEffect(() => {
    window.setTimeout(() => {
      setEnable(true)
    }, 500)
  }, [])
  return enable
}

const animationTimeout = 300

const ResizeHandle = ({
  className,
  resizing,
  minWidth,
  maxWidth,
  resizeHandlePos,
  open,
  onOpen,
  onResizing,
  onWidthChange,
  ...rest
}: ResizeHandleProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const onResizeStart = useCallback(() => {
    const panelContainer = ref.current?.parentElement
    if (!panelContainer) throw new Error('Parent element not found for resize indicator')

    const { left: anchorLeft, right: anchorRight } = panelContainer.getBoundingClientRect()

    function onMouseMove(e: MouseEvent) {
      e.preventDefault()
      if (!panelContainer) return
      const newWidth = Math.min(
        maxWidth,
        Math.max(
          resizeHandlePos === 'right' ? e.clientX - anchorLeft : anchorRight - e.clientX,
          minWidth,
        ),
      )
      onWidthChange(newWidth)
      onResizing(true)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener(
      'mouseup',
      () => {
        onResizing(false)
        document.removeEventListener('mousemove', onMouseMove)
      },
      { once: true },
    )
  }, [maxWidth, resizeHandlePos, minWidth, onWidthChange, onResizing, onOpen])

  return (
    <div
      {...rest}
      ref={ref}
      className={cn(
        'absolute bottom-0 right-0 top-0 z-[1] flex w-4 translate-x-1/2 cursor-col-resize justify-center bg-transparent opacity-0 transition-opacity hover:opacity-100',
        resizing && 'opacity-100',
        open && 'hidden',
        resizeHandlePos === 'left' && 'left-0 right-auto -translate-x-1/2',
        className,
      )}
      onMouseDown={onResizeStart}
    >
      <div className="absolute" />
    </div>
  )
}

export const ResizePanel = forwardRef<HTMLDivElement, ResizePanelProps>(function ResizePanel(
  {
    children,
    className,
    resizing,
    minWidth,
    maxWidth,
    width,
    enableAnimation: _enableAnimation = true,
    open,
    unmountOnExit,
    onOpen,
    onResizing,
    onWidthChange,
    resizeHandlePos,
    resizeHandleOffset,
    resizeHandleVerticalPadding,
    ...rest
  },
  ref,
) {
  const enableAnimation = useEnableAnimation() && _enableAnimation
  const safeWidth = Math.min(maxWidth, Math.max(minWidth, width))
  const [{ status }, toggle] = useTransition({
    timeout: animationTimeout,
  })
  useLayoutEffect(() => {
    toggle(open)
  }, [open])
  return (
    <div
      {...rest}
      ref={ref}
      style={{
        width: `${safeWidth}px`,
        minWidth: `${safeWidth}px`,
        maxWidth: open ? '50%' : undefined,
        marginLeft: !open && resizeHandlePos === 'right' ? `${safeWidth * -1}px` : undefined,
        marginRight: !open && resizeHandlePos === 'left' ? `${safeWidth * -1}px` : undefined,
        transition: enableAnimation
          ? `margin-left ${animationTimeout} .05s, margin-right ${animationTimeout}ms .05s, width ${animationTimeout}ms .05s`
          : undefined,
      }}
      className={cn('relative h-full overflow-auto', status === 'exited' && 'invisible', className)}
      data-enable-animation={enableAnimation && !resizing}
    >
      {!(status === 'exited' && unmountOnExit !== false) && children}
      <ResizeHandle
        resizeHandlePos={resizeHandlePos}
        resizeHandleOffset={resizeHandleOffset}
        resizeHandleVerticalPadding={resizeHandleVerticalPadding}
        maxWidth={maxWidth}
        minWidth={minWidth}
        onOpen={onOpen}
        onResizing={onResizing}
        onWidthChange={onWidthChange}
        open={open}
        resizing={resizing}
      />
    </div>
  )
})
