import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

type CarouselColumnsOptions = {
  /** Preferred card width; cards stretch or shrink from here so a whole number fits. */
  preferredRem?: number
  /** Horizontal gutter between cards, matching the items' padding. */
  gapRem?: number
  minColumns?: number
  maxColumns?: number
}

/**
 * Sizes carousel slides so a whole number of cards fills the row exactly, without cutting the
 * last one; Embla's `slidesToScroll: 'auto'` then pages by full rows.
 */
export function useCarouselColumns<T extends HTMLElement>({
  preferredRem = 9,
  gapRem = 0.75,
  minColumns = 2,
  maxColumns = Infinity,
}: CarouselColumnsOptions = {}) {
  const ref = useRef<T>(null)
  const [columns, setColumns] = useState(6)

  // Measure before paint so the first frame already has the final card size.
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const update = (width: number) => {
      const remPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const gap = gapRem * remPx
      const fitted = Math.round((width + gap) / (preferredRem * remPx + gap))
      const next = Math.min(maxColumns, Math.max(minColumns, fitted))
      setColumns((previous) => (previous === next ? previous : next))
    }
    update(element.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [gapRem, maxColumns, minColumns, preferredRem])

  const itemStyle: CSSProperties = { flexBasis: `${100 / columns}%` }
  return { ref, columns, itemStyle }
}
