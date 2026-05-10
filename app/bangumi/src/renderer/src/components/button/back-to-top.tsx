import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { mainContainerRight } from '@renderer/state/main-bounding-box'
import { mainPanelScrollPositionAtom, scrollViewportAtom } from '@renderer/state/scroll'
import { useAtomValue } from 'jotai'
import { ArrowUpIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

const SHOW_THRESHOLD = 160
const PROGRESS_PATH = 'M 18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32'

type BackToTopButtonProps = {
  className?: string
  scrollTop?: number
  viewport?: HTMLElement | null
}

export function BackToTopButton({ className, scrollTop, viewport }: BackToTopButtonProps) {
  const mainScrollTop = useAtomValue(mainPanelScrollPositionAtom)
  const mainViewport = useAtomValue(scrollViewportAtom)
  const mainRight = useAtomValue(mainContainerRight)
  const [maxScrollTop, setMaxScrollTop] = useState(0)
  const [trackedScrollTop, setTrackedScrollTop] = useState(0)
  const isMainViewport = viewport === undefined
  const targetViewport = viewport === undefined ? mainViewport : viewport
  const currentScrollTop = scrollTop ?? (isMainViewport ? mainScrollTop : trackedScrollTop)
  const progress = maxScrollTop > 0 ? Math.min(1, Math.max(0, currentScrollTop / maxScrollTop)) : 0
  const visible = currentScrollTop > SHOW_THRESHOLD && maxScrollTop > SHOW_THRESHOLD

  useEffect(() => {
    if (!targetViewport) {
      setMaxScrollTop(0)
      return
    }

    const updateMaxScrollTop = () => {
      setMaxScrollTop(Math.max(0, targetViewport.scrollHeight - targetViewport.clientHeight))
    }
    const resizeObserver = new ResizeObserver(updateMaxScrollTop)

    updateMaxScrollTop()
    resizeObserver.observe(targetViewport)
    if (targetViewport.firstElementChild) resizeObserver.observe(targetViewport.firstElementChild)

    return () => resizeObserver.disconnect()
  }, [targetViewport])

  useEffect(() => {
    if (!targetViewport || scrollTop !== undefined || viewport === undefined) return

    const updateScrollTop = () => setTrackedScrollTop(targetViewport.scrollTop)

    updateScrollTop()
    targetViewport.addEventListener('scroll', updateScrollTop, { passive: true })
    return () => targetViewport.removeEventListener('scroll', updateScrollTop)
  }, [scrollTop, targetViewport, viewport])

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
      style={
        isMainViewport && mainRight > 0
          ? { right: `calc(100vw - ${mainRight}px + 1.5rem)` }
          : undefined
      }
      onClick={() => targetViewport?.scrollTo({ top: 0, behavior: 'smooth' })}
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
