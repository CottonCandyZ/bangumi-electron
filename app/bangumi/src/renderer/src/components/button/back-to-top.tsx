import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { ArrowUpIcon } from 'lucide-react'
import { useEffect, useRef, type CSSProperties } from 'react'

const SHOW_THRESHOLD = 160
const VISIBLE_CLASSES = ['translate-y-0', 'opacity-100']
const HIDDEN_CLASSES = ['pointer-events-none', 'translate-y-2', 'opacity-0']

type BackToTopButtonProps = {
  className?: string
  onBackToTop?: () => void
  position?: 'absolute' | 'fixed'
  style?: CSSProperties
  viewport: HTMLElement | null
}

export function BackToTopButton({
  className,
  onBackToTop,
  position = 'fixed',
  style,
  viewport,
}: BackToTopButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const updateFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const button = buttonRef.current
    if (!viewport || !button) return

    let maxScrollTop = 0

    const updateButtonState = () => {
      const currentScrollTop = viewport.scrollTop
      const progress =
        maxScrollTop > 0 ? Math.min(1, Math.max(0, currentScrollTop / maxScrollTop)) : 0
      const visible = currentScrollTop > SHOW_THRESHOLD && maxScrollTop > SHOW_THRESHOLD

      button.style.background = `conic-gradient(var(--primary) ${progress * 360}deg, transparent 0deg)`
      for (const className of VISIBLE_CLASSES) button.classList.toggle(className, visible)
      for (const className of HIDDEN_CLASSES) button.classList.toggle(className, !visible)
    }

    const updateMaxScrollTop = () => {
      maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight)
      updateButtonState()
    }
    const scheduleUpdateMaxScrollTop = () => {
      if (updateFrameRef.current !== null) return
      updateFrameRef.current = window.requestAnimationFrame(() => {
        updateFrameRef.current = null
        updateMaxScrollTop()
      })
    }
    const resizeObserver = new ResizeObserver(updateMaxScrollTop)
    const mutationObserver = new MutationObserver(scheduleUpdateMaxScrollTop)

    updateMaxScrollTop()
    resizeObserver.observe(viewport)
    if (viewport.firstElementChild) resizeObserver.observe(viewport.firstElementChild)
    mutationObserver.observe(viewport, {
      attributes: true,
      childList: true,
      subtree: true,
    })
    viewport.addEventListener('scroll', scheduleUpdateMaxScrollTop, { passive: true })
    viewport.addEventListener('scroll', updateButtonState, { passive: true })

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      viewport.removeEventListener('scroll', scheduleUpdateMaxScrollTop)
      viewport.removeEventListener('scroll', updateButtonState)
      if (updateFrameRef.current !== null) {
        window.cancelAnimationFrame(updateFrameRef.current)
        updateFrameRef.current = null
      }
    }
  }, [viewport])

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      aria-label="返回顶部"
      className={cn(
        'no-drag-region z-30 size-11 rounded-full p-[2px] shadow-lg transition duration-200 hover:-translate-y-0.5 active:scale-95',
        position === 'fixed' ? 'fixed right-6 bottom-6' : 'absolute right-4 bottom-4',
        HIDDEN_CLASSES,
        className,
      )}
      style={style}
      onClick={() => {
        if (onBackToTop) {
          onBackToTop()
          return
        }

        viewport?.scrollTo({ top: 0, behavior: 'smooth' })
      }}
    >
      <span className="bg-background text-primary flex size-full items-center justify-center rounded-full">
        <ArrowUpIcon className="size-5" strokeWidth={2.75} />
      </span>
    </Button>
  )
}
