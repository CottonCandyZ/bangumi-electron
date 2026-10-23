import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStateHook } from '@renderer/hooks/use-cache-state'
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from 'motion/react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

/**
 * Slides are placed on an unbounded virtual line: each DOM slide sits at whichever of its
 * periodic positions falls in a window starting this many slides left of the current one.
 * A slide leaving the window on one side reappears on the other while both spots are off screen.
 */
const WINDOW_BEHIND = 2
const GAP = 12
/** How much of the previous card stays visible on the left edge. */
const PEEK = 36
/**
 * Damping ratio ≈ 0.82: a resting slide overshoots about 1% before settling, while a fling
 * carries its release speed into the landing.
 */
const SPRING = {
  type: 'spring',
  stiffness: 180,
  damping: 22,
  mass: 1,
  restDelta: 0.001,
  restSpeed: 0.01,
} as const
const AUTOPLAY_DELAY = 6000

/** Fills once over the autoplay delay; while paused only the empty track shows. */
function AutoplayCountdown({ running }: { running: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="pointer-events-none absolute bottom-3 left-3 size-5 -rotate-90 rounded-full bg-black/30 backdrop-blur-sm"
    >
      <circle cx="10" cy="10" r="6.5" fill="none" strokeWidth="2.5" className="stroke-white/25" />
      {running && (
        <motion.circle
          cx="10"
          cy="10"
          r="6.5"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="stroke-white/80"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: AUTOPLAY_DELAY / 1000, ease: 'linear' }}
        />
      )}
    </svg>
  )
}
/** Pointer travel (px) before a press counts as a drag and its click is swallowed. */
const DRAG_THRESHOLD = 6
/** Release speed (px/ms) that flips to the neighbour even after a short drag. */
const FLICK_VELOCITY = 0.4
/** How far (s) a release keeps coasting at its speed when choosing where to land. */
const INERTIA_PROJECTION = 0.12
/** Horizontal wheel distance (px) that counts as one swipe on a trackpad. */
const WHEEL_THRESHOLD = 48
/** A wheel gesture ends after this much silence, so trackpad inertia cannot skip several slides. */
const WHEEL_IDLE = 180

export type BigCarouselSlideState = {
  selected: boolean
}

export type BigCarouselProps<T> = {
  items: T[]
  getKey: (item: T) => string | number
  renderSlide: (item: T, state: BigCarouselSlideState) => ReactNode
  label: string
  /** Width / height of a collapsed card; the expanded card adds an info panel to its right. */
  coverRatio?: number
  /**
   * Distance (px) from the viewport's left edge to the selected card, given the viewport width.
   * The previous card peeks out of this space; full-bleed callers pass their page padding.
   */
  leading?: (width: number) => number
  className?: string
  autoPlay?: boolean
}

const defaultLeading = () => PEEK + GAP

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const mod = (value: number, length: number) => ((value % length) + length) % length

/** The periodic position of a DOM slide that lies in the window around `value`. */
const virtualIndexOf = (slot: number, value: number, slots: number) =>
  slots === 1 ? 0 : slot + slots * Math.ceil((value - WINDOW_BEHIND - slot) / slots)

/** Invert a card's x offset, including the extra space occupied by the expanding card. */
function distanceFromOffset(offset: number, step: number, extra: number) {
  if (offset <= 0) return offset / step
  if (offset >= step + extra) return (offset - extra) / step
  return offset / (step + extra)
}

export function BigCarousel<T>({
  items,
  getKey,
  renderSlide,
  label,
  coverRatio = 2 / 3,
  leading: getLeading = defaultLeading,
  className,
  autoPlay = true,
}: BigCarouselProps<T>) {
  const count = items.length
  const viewportRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const width = useElementWidth(viewportRef)

  const leading = count > 1 ? Math.round(getLeading(width)) : 0
  const height = Math.round(clamp(width * 0.28, 260, 440))
  const small = Math.round(height * coverRatio)
  const big = Math.round(Math.min(width - leading * 2, small + clamp(width * 0.38, 280, 760)))
  const step = small + GAP
  // Enough DOM slides to cover the viewport plus the off-screen spots used for wrapping.
  // With a typical list one copy is enough, so every item keeps a single, persistent node.
  const visibleAhead = Math.ceil(Math.max(0, width - leading - big) / step) + 1
  const copies = count < 2 ? 1 : Math.max(1, Math.ceil((visibleAhead + WINDOW_BEHIND + 1) / count))
  const slots = count * copies

  // The fractional slide position drives layout directly, outside React, every animation frame.
  // It is unbounded: looping never needs a jump back, so rapid input is never cut short.
  // Coming back to the page resumes on the card the user left, not the first one.
  const { init: savedIndex, setter: saveIndex } = useStateHook<number>({
    key: `big-carousel-${label}`,
  })
  const [startIndex] = useState(() =>
    savedIndex !== undefined && savedIndex < count ? savedIndex : 0,
  )
  const position = useMotionValue(startIndex)
  const controls = useRef<AnimationPlaybackControls | null>(null)
  const target = useRef(startIndex)
  /** Direction of the running animation; 0 while dragging or at rest. */
  const direction = useRef(0)
  const [index, setIndex] = useState(startIndex)
  const [nearest, setNearest] = useState(startIndex)
  // Mount skips the slides' own fades.
  const [instant, setInstant] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [documentHidden, setDocumentHidden] = useState(() => document.hidden)

  const selected = count ? mod(index, count) : 0

  const [previousCount, setPreviousCount] = useState(count)
  if (previousCount !== count) {
    setPreviousCount(count)
    setIndex(0)
    setInstant(true)
  }
  const positionedCount = useRef(count)
  useLayoutEffect(() => {
    if (positionedCount.current === count) return
    positionedCount.current = count
    controls.current?.stop()
    target.current = 0
    position.jump(0)
  }, [count, position])

  useEffect(() => {
    saveIndex(selected)
  }, [saveIndex, selected])

  useEffect(() => {
    if (!instant) return
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setInstant(false))
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [instant])

  // The current card shrinks and its neighbour grows in proportion to the fractional position.
  // Every slide is positioned on its own, so a slide wrapping around keeps its node and images.
  useLayoutEffect(() => {
    const extra = big - small
    const cache: {
      element: HTMLDivElement
      caption: HTMLElement | null
      info: HTMLElement | null
      transform?: string
      width?: string
      captionOpacity?: string
      infoOpacity?: string
      infoTranslate?: string
    }[] = []
    let previousNearest: number | undefined
    const apply = (raw: number) => {
      // Past the target the spring's overshoot moves the whole strip rigidly: the bounce stays,
      // but card widths hold at the target so the next card never widens and flashes its info.
      const value =
        direction.current > 0
          ? Math.min(raw, target.current)
          : direction.current < 0
            ? Math.max(raw, target.current)
            : raw
      const overshoot = (raw - value) * step
      const floor = Math.floor(value)
      const fraction = value - floor
      slideRefs.current.forEach((slide, slot) => {
        if (!slide || slot >= slots) return
        const virtual = virtualIndexOf(slot, value, slots)
        const expansion = Math.max(0, 1 - Math.abs(virtual - value))
        // Width added by the expanded cards that sit before this one.
        const before = virtual <= floor ? 0 : virtual === floor + 1 ? 1 - fraction : 1
        const x = (virtual - value) * step + leading + extra * before - overshoot
        const next = {
          transform: `translate3d(${x}px, 0, 0)`,
          width: `${small + extra * expansion}px`,
          captionOpacity: Math.max(0, 1 - expansion * 2).toFixed(3),
          infoOpacity: Math.max(0, expansion * 2 - 1).toFixed(3),
          // Text carries on with the spring after the card width reaches its target.
          infoTranslate: `${((1 - expansion - (expansion === 1 ? Math.abs(raw - value) : 0)) * 40).toFixed(3)}% 0`,
        }
        let previous = cache[slot]
        if (previous?.element !== slide) {
          previous = cache[slot] = {
            element: slide,
            caption: slide.querySelector('[data-big-carousel-caption]'),
            info: slide.querySelector('[data-big-carousel-info]'),
          }
        }
        if (previous.transform !== next.transform) slide.style.transform = next.transform
        if (previous.width !== next.width) slide.style.width = next.width
        // Write only to the animated layers. Inherited custom properties on the slide made
        // Chromium recalculate styles for the entire cover, backdrop and text subtree each frame.
        if (previous.caption && previous.captionOpacity !== next.captionOpacity) {
          previous.caption.style.opacity = next.captionOpacity
        }
        if (previous.info && previous.infoOpacity !== next.infoOpacity) {
          previous.info.style.opacity = next.infoOpacity
        }
        if (previous.info && previous.infoTranslate !== next.infoTranslate) {
          previous.info.style.translate = next.infoTranslate
        }
        Object.assign(previous, next)
      })
      const nextNearest = Math.round(value)
      if (previousNearest !== nextNearest) {
        previousNearest = nextNearest
        setNearest(nextNearest)
      }
    }
    apply(position.get())
    return position.on('change', apply)
  }, [big, leading, position, slots, small, step])

  const moveTo = useCallback(
    (next: number, velocity?: number) => {
      if (count < 2) return
      target.current = next
      direction.current = Math.sign(next - position.get())
      setIndex(next)
      controls.current?.stop()
      // Each move continues from the current position and speed, so rapid input never stacks.
      controls.current = animate(position, next, {
        ...SPRING,
        velocity: velocity ?? position.getVelocity(),
      })
    },
    [count, position],
  )

  const go = useCallback(
    (delta: number) => {
      if (delta !== 0) moveTo(target.current + delta)
    },
    [moveTo],
  )

  useEffect(() => () => controls.current?.stop(), [])

  useEffect(() => {
    const onVisibilityChange = () => setDocumentHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  const paused = !autoPlay || hovered || dragging || documentHidden || count < 2
  useEffect(() => {
    if (paused) return
    // Restart the countdown after every move, including manual ones.
    const timer = setTimeout(() => go(1), AUTOPLAY_DELAY)
    return () => clearTimeout(timer)
  }, [go, index, paused])

  const suppressClick = useRef(false)
  const dragState = useRef<{
    pointerId: number
    startX: number
    startY: number
    startPosition: number
    anchor: number
    startOffset: number
    moved: boolean
    samples: { x: number; t: number; position: number }[]
  } | null>(null)

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragState.current
      if (!drag || event.pointerId !== drag.pointerId) return
      const dx = event.clientX - drag.startX
      const dy = event.clientY - drag.startY
      if (!drag.moved) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return
        // A mostly vertical touch gesture belongs to page scrolling.
        if (event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) {
          dragState.current = null
          moveTo(target.current)
          return
        }
        drag.moved = true
        setDragging(true)
      }
      // The grabbed card stays under the pointer while its neighbours expand and collapse.
      const nextPosition = clamp(
        drag.anchor - distanceFromOffset(drag.startOffset + dx, step, big - small),
        drag.startPosition - (count - 1),
        drag.startPosition + (count - 1),
      )
      drag.samples.push({ x: event.clientX, t: event.timeStamp, position: nextPosition })
      if (drag.samples.length > 6) drag.samples.shift()
      position.set(nextPosition)
    }
    const onUp = (event: PointerEvent) => {
      const drag = dragState.current
      if (!drag || event.pointerId !== drag.pointerId) return
      dragState.current = null
      if (!drag.moved) {
        // A plain press only paused the motion; let it finish.
        moveTo(target.current)
        return
      }
      suppressClick.current = true
      setDragging(false)
      const first = drag.samples[0]
      const last = drag.samples[drag.samples.length - 1]
      const pixelVelocity =
        first && last && last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0
      const slideVelocity =
        first && last && last.t > first.t
          ? ((last.position - first.position) * 1000) / (last.t - first.t)
          : 0
      const origin = Math.round(drag.startPosition)
      let next = Math.round(position.get() + slideVelocity * INERTIA_PROJECTION)
      if (next === origin && Math.abs(pixelVelocity) > FLICK_VELOCITY) {
        next = origin + (pixelVelocity < 0 ? 1 : -1)
      }
      moveTo(clamp(next, origin - (count - 1), origin + (count - 1)), slideVelocity)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [big, count, moveTo, position, small, step])

  useWheelSwipe(viewportRef, go)

  return (
    <section
      className={cn('group/big-carousel relative', className)}
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          go(-1)
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          go(1)
        }
      }}
    >
      <div className="relative">
        <div
          ref={viewportRef}
          className="cursor-default touch-pan-y overflow-hidden select-none"
          style={
            {
              height,
              '--big-carousel-height': `${height}px`,
              '--big-carousel-cover': `${small}px`,
              '--big-carousel-info': `${big - small}px`,
            } as CSSProperties
          }
          onPointerDown={(event) => {
            if (event.button !== 0 || count < 2) return
            suppressClick.current = false
            // Catch the carousel mid-flight, like grabbing a moving sheet.
            controls.current?.stop()
            direction.current = 0
            const startPosition = position.get()
            const slide =
              event.target instanceof Element
                ? event.target.closest<HTMLDivElement>('[aria-roledescription=slide]')
                : null
            const slot = slide ? slideRefs.current.indexOf(slide) : -1
            const anchor =
              slot >= 0 ? virtualIndexOf(slot, startPosition, slots) : Math.round(startPosition)
            const distance = anchor - startPosition
            dragState.current = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              startPosition,
              anchor,
              startOffset: slide
                ? slide.getBoundingClientRect().left -
                  event.currentTarget.getBoundingClientRect().left -
                  leading
                : distance * step + (big - small) * clamp(distance, 0, 1),
              moved: false,
              samples: [{ x: event.clientX, t: event.timeStamp, position: startPosition }],
            }
          }}
          onClickCapture={(event) => {
            if (!suppressClick.current) return
            suppressClick.current = false
            event.preventDefault()
            event.stopPropagation()
          }}
        >
          <div className={cn('relative h-full', instant && '[&_*]:transition-none!')}>
            {Array.from({ length: slots }, (_, slot) => {
              const item = items[slot % count]
              const isSelected = virtualIndexOf(slot, nearest, slots) === nearest
              return (
                <div
                  key={`${Math.floor(slot / count)}-${getKey(item)}`}
                  ref={(slide) => {
                    slideRefs.current[slot] = slide
                  }}
                  className="absolute top-0 left-0 h-full overflow-hidden rounded-[32px] will-change-transform [contain:layout_paint]"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${(slot % count) + 1} / ${count}`}
                  aria-hidden={!isSelected || undefined}
                  aria-current={isSelected || undefined}
                  onClickCapture={(event) => {
                    if (isSelected) return
                    // Collapsed cards select themselves instead of navigating.
                    event.preventDefault()
                    event.stopPropagation()
                    moveTo(virtualIndexOf(slot, position.get(), slots))
                  }}
                >
                  {/* Slides stay mounted and only move, so their images never re-decode. */}
                  {renderSlide(item, { selected: isSelected })}
                  {isSelected && autoPlay && count > 1 && (
                    // A new key restarts the ring with the timer, after every move or pause.
                    <AutoplayCountdown key={`${index}-${paused}`} running={!paused} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {count > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label={`上一个${label}`}
              onClick={() => go(-1)}
              className="bg-background/70 absolute top-1/2 left-3 z-10 size-9 -translate-y-1/2 rounded-full opacity-0 backdrop-blur transition-opacity group-focus-within/big-carousel:opacity-100 group-hover/big-carousel:opacity-100"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={`下一个${label}`}
              onClick={() => go(1)}
              className="bg-background/70 absolute top-1/2 right-3 z-10 size-9 -translate-y-1/2 rounded-full opacity-0 backdrop-blur transition-opacity group-focus-within/big-carousel:opacity-100 group-hover/big-carousel:opacity-100"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          className="mt-3 flex items-center gap-1.5"
          style={{ paddingInline: leading }}
          role="tablist"
        >
          {items.map((item, itemIndex) => (
            <button
              key={getKey(item)}
              type="button"
              role="tab"
              aria-selected={itemIndex === selected}
              aria-label={`跳转到第 ${itemIndex + 1} 个`}
              onPointerDown={(event) => {
                // The squeezing indicators can move between press and release. Keep the click
                // on the pressed dot even when the width animation moves it out of the pointer.
                if (event.button === 0) event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onClick={() => {
                // Take the shorter way around the loop.
                const forward = mod(itemIndex - selected, count)
                go(forward <= count / 2 ? forward : forward - count)
              }}
              className={cn(
                // Extend the transparent hit area into the gap without changing the squeezing dots.
                "relative h-1.5 rounded-full transition-all duration-300 before:absolute before:-inset-x-0.75 before:-inset-y-3 before:content-['']",
                itemIndex === selected
                  ? 'bg-foreground/70 w-6'
                  : 'bg-foreground/15 hover:bg-foreground/30 w-1.5',
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function useElementWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(1000)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    setWidth(element.clientWidth)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return width
}

/** Trackpad two-finger swipes: one slide per gesture once the distance passes a threshold. */
function useWheelSwipe(ref: React.RefObject<HTMLElement | null>, go: (delta: number) => void) {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    let accumulated = 0
    let locked = false
    let idleTimer: ReturnType<typeof setTimeout> | undefined
    const onWheel = (event: WheelEvent) => {
      // Leave vertical scrolling to the page.
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      event.preventDefault()
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        accumulated = 0
        locked = false
      }, WHEEL_IDLE)
      if (locked) return
      accumulated += event.deltaX
      if (Math.abs(accumulated) < WHEEL_THRESHOLD) return
      go(accumulated > 0 ? 1 : -1)
      locked = true
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      clearTimeout(idleTimer)
      element.removeEventListener('wheel', onWheel)
    }
  }, [go, ref])
}
