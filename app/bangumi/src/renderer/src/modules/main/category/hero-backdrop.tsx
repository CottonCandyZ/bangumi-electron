import { useLayoutEffect, useRef } from 'react'

const BLUR = 40
// The heavy blur has no fine detail to preserve; half CSS resolution keeps the bitmap small.
const RESOLUTION = 0.5
const CACHE_LIMIT = 32
const TINT_STOPS = [
  [0.1, 'rgb(8.625 8.625 8.625 / 64%)'],
  [0.5, 'rgb(4.842 4.842 4.842 / 76%)'],
  [0.9, 'rgb(2.706 2.706 2.706 / 85%)'],
] as const
const TINT = `linear-gradient(to right, ${TINT_STOPS.map(([offset, color]) => `${color} ${offset * 100}%`).join(', ')})`

const cache = new Map<string, Promise<OffscreenCanvas>>()

function cachedBackdrop(src: string, width: number, height: number) {
  const key = JSON.stringify([src, width, height])
  const cached = cache.get(key)
  if (cached) {
    cache.delete(key)
    cache.set(key, cached)
    return cached
  }

  const image = new Image()
  image.src = src
  const result = image.decode().then(() => {
    const w = Math.max(1, Math.round(width * RESOLUTION))
    const h = Math.max(1, Math.round(height * RESOLUTION))
    const source = new OffscreenCanvas(w, h)
    const sourceContext = source.getContext('2d')
    const output = new OffscreenCanvas(w, h)
    const outputContext = output.getContext('2d')
    if (!sourceContext || !outputContext) throw new Error('Canvas 2D is unavailable')

    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight)
    const imageWidth = image.naturalWidth * scale
    const imageHeight = image.naturalHeight * scale
    sourceContext.drawImage(
      image,
      (w - imageWidth) / 2,
      (h - imageHeight) / 2,
      imageWidth,
      imageHeight,
    )
    const tint = sourceContext.createLinearGradient(0, 0, w, 0)
    for (const [offset, color] of TINT_STOPS) tint.addColorStop(offset, color)
    sourceContext.fillStyle = tint
    sourceContext.fillRect(0, 0, w, h)

    // Match the original filter on the combined image and tint, before the 1.25x CSS scale.
    outputContext.filter = `blur(${BLUR * RESOLUTION}px)`
    outputContext.drawImage(source, 0, 0)
    return output
  })
  cache.set(key, result)
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!)
  void result.catch(() => {
    if (cache.get(key) === result) cache.delete(key)
  })
  return result
}

/** Keep a static bitmap on screen instead of a live, full-size CSS blur layer. */
export function HeroBackdrop({ src }: { src?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const fallbackRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    const host = hostRef.current
    const fallback = fallbackRef.current
    const canvas = canvasRef.current
    if (!host || !fallback || !canvas) return
    canvas.hidden = true
    fallback.hidden = false
    if (!src) return
    let request = 0
    let previousSize = ''
    let resizeTimer: ReturnType<typeof setTimeout> | undefined
    const draw = (width: number, height: number, delay = 0) => {
      const size = `${width},${height}`
      if (width <= 0 || height <= 0 || size === previousSize) return
      previousSize = size
      const currentRequest = ++request
      clearTimeout(resizeTimer)
      canvas.hidden = true
      fallback.hidden = false
      const paint = () => {
        void cachedBackdrop(src, width, height).then(
          (bitmap) => {
            if (request !== currentRequest) return
            canvas.width = bitmap.width
            canvas.height = bitmap.height
            const context = canvas.getContext('2d')
            if (!context) return
            // Drawing is allowed for cross-origin covers; exporting their pixels is not needed.
            context.drawImage(bitmap, 0, 0)
            canvas.hidden = false
            fallback.hidden = true
          },
          () => {}, // Keep the original CSS background if the image cannot be decoded.
        )
      }
      if (delay) resizeTimer = setTimeout(paint, delay)
      else paint()
    }
    draw(host.clientWidth, host.clientHeight)
    // This host has the fixed expanded-card size; dragging only clips its ancestor.
    const observer = new ResizeObserver(([entry]) => {
      // Resize continuously with the CSS fallback, then cache the settled size once.
      draw(Math.round(entry.contentRect.width), Math.round(entry.contentRect.height), 100)
    })
    observer.observe(host)
    return () => {
      request++
      clearTimeout(resizeTimer)
      observer.disconnect()
    }
  }, [src])

  return (
    <div ref={hostRef} className="absolute inset-0 scale-125 transform-gpu">
      <div
        ref={fallbackRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          filter: `blur(${BLUR}px)`,
          backgroundImage: [TINT, ...(src ? [`url(${JSON.stringify(src)})`] : [])].join(', '),
        }}
      />
      <canvas ref={canvasRef} aria-hidden hidden className="absolute inset-0 size-full" />
    </div>
  )
}
