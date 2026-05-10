import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { ArrowUpIcon } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'

const SHOW_THRESHOLD = 160
const PROGRESS_PATH = 'M 18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32'

type BackToTopButtonProps = {
  className?: string
  style?: CSSProperties
  scrollTop?: number
  viewport: HTMLElement | null
}

export function BackToTopButton({ className, scrollTop, style, viewport }: BackToTopButtonProps) {
  const [maxScrollTop, setMaxScrollTop] = useState(0)
  const [trackedScrollTop, setTrackedScrollTop] = useState(0)
  const currentScrollTop = scrollTop ?? trackedScrollTop
  const progress = maxScrollTop > 0 ? Math.min(1, Math.max(0, currentScrollTop / maxScrollTop)) : 0
  const visible = currentScrollTop > SHOW_THRESHOLD && maxScrollTop > SHOW_THRESHOLD

  useEffect(() => {
    if (!viewport) {
      setMaxScrollTop(0)
      return
    }

    const updateMaxScrollTop = () => {
      setMaxScrollTop(Math.max(0, viewport.scrollHeight - viewport.clientHeight))
    }
    const resizeObserver = new ResizeObserver(updateMaxScrollTop)

    updateMaxScrollTop()
    resizeObserver.observe(viewport)
    if (viewport.firstElementChild) resizeObserver.observe(viewport.firstElementChild)

    return () => resizeObserver.disconnect()
  }, [viewport])

  useEffect(() => {
    if (!viewport || scrollTop !== undefined) return

    const updateScrollTop = () => setTrackedScrollTop(viewport.scrollTop)

    updateScrollTop()
    viewport.addEventListener('scroll', updateScrollTop, { passive: true })
    return () => viewport.removeEventListener('scroll', updateScrollTop)
  }, [scrollTop, viewport])

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="返回顶部"
      className={cn(
        'no-drag-region bg-background/85 fixed right-6 bottom-6 z-30 size-11 rounded-full p-0 shadow-lg backdrop-blur transition-all duration-200',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        className,
      )}
      style={style}
      onClick={() => viewport?.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <svg className="absolute inset-0 size-full" viewBox="0 0 36 36" aria-hidden>
        <path
          d={PROGRESS_PATH}
          fill="none"
          pathLength={1}
          stroke="currentColor"
          strokeWidth={2}
          className="text-muted-foreground/20"
        />
        <path
          d={PROGRESS_PATH}
          fill="none"
          pathLength={1}
          stroke="currentColor"
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
          strokeLinecap="round"
          strokeWidth={2}
          className="text-primary transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <ArrowUpIcon className="relative size-4" />
    </Button>
  )
}
