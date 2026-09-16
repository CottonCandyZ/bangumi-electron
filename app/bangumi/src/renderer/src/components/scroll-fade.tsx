import { cn } from '@renderer/lib/utils'
import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Fade only edges with hidden content, including after content or viewport resizing. */
export function ScrollFade({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label: string
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: 0, end: 0 })

  useEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return
    const update = () => {
      const fadeSize = parseFloat(getComputedStyle(viewport).fontSize) * 1.5
      const strength = (distance: number) => Math.min(1, Math.max(0, distance / fadeSize))
      const start = strength(viewport.scrollTop)
      const end = strength(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop)
      setEdges((previous) =>
        previous.start === start && previous.end === end ? previous : { start, end },
      )
    }
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    observer.observe(content)
    viewport.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      observer.disconnect()
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  return (
    <div
      ref={viewportRef}
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        'focus-visible:ring-ring min-h-0 overflow-y-auto overscroll-contain rounded-sm focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
      style={{
        maskImage: `linear-gradient(to bottom, rgb(0 0 0 / ${1 - edges.start}), #000 1.5em, #000 calc(100% - 1.5em), rgb(0 0 0 / ${1 - edges.end}))`,
      }}
    >
      <div ref={contentRef} className="px-1 py-2">
        {children}
      </div>
    </div>
  )
}
