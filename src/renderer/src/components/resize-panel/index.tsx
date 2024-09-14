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
  onResizing: (resizing: boolean) => void
  onWidthChange: (width: number) => void
}

export interface ResizePanelProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  resizing: boolean
  open: boolean
  floating?: boolean
  minWidth: number
  maxWidth: number
  width: number
  resizeHandlePos: 'left' | 'right'
  enableAnimation?: boolean
  unmountOnExit?: boolean
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
  }, [maxWidth, resizeHandlePos, minWidth, onWidthChange, onResizing])

  return (
    <div
      {...rest}
      ref={ref}
      className={cn(
        'no-drag-region absolute bottom-0 right-0 top-0 z-[1] flex w-3 translate-x-3/4 cursor-col-resize justify-center bg-transparent opacity-0 transition-opacity hover:opacity-100',
        resizing && 'opacity-100',
        !open && 'hidden',
        resizeHandlePos === 'left' && 'left-0 right-auto -translate-x-1/2',
        className,
      )}
      onMouseDown={onResizeStart}
    >
      <div
        className={cn(
          'absolute h-full w-0.5 -translate-x-[2.5px] rounded-sm bg-blue-400 transition-all duration-200',
          resizing && 'w-1',
        )}
      />
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
    onResizing,
    onWidthChange,
    resizeHandlePos,
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
        transition:
          enableAnimation && !resizing
            ? `margin-left ${animationTimeout} .05s, margin-right ${animationTimeout}ms .05s, width ${animationTimeout}ms .05s`
            : undefined,
      }}
      className={cn('relative h-full', status === 'exited' && 'invisible', className)}
    >
      {!(status === 'exited' && unmountOnExit !== false) && children}
      <ResizeHandle
        resizeHandlePos={resizeHandlePos}
        maxWidth={maxWidth}
        minWidth={minWidth}
        onResizing={onResizing}
        onWidthChange={onWidthChange}
        open={open}
        resizing={resizing}
      />
    </div>
  )
})
