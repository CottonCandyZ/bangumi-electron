import type { CarouselApi } from '@renderer/components/ui/carousel'
import { useEffect, useState, type CSSProperties } from 'react'

export function useCarouselEdgeFade(api: CarouselApi) {
  const [edges, setEdges] = useState({ start: 0, end: 0 })
  useEffect(() => {
    if (!api) return
    const update = () => {
      const distance = carouselEdgeDistances(api)
      const start = edgeStrength(distance.start)
      const end = edgeStrength(distance.end)
      setEdges((previous) =>
        previous.start === start && previous.end === end ? previous : { start, end },
      )
    }
    update()
    api.on('scroll', update).on('reInit', update)
    return () => {
      api.off('scroll', update).off('reInit', update)
    }
  }, [api])
  return scrollEdgeMask('right', edges.start, edges.end)
}

export function carouselEdgeDistances(api: NonNullable<CarouselApi>) {
  // DOM scrollWidth includes slide gutters and overflow; it is not Embla's travel range.
  const { location, limit } = api.internalEngine()
  const position = Math.min(limit.max, Math.max(limit.min, location.get()))
  return { start: limit.max - position, end: position - limit.min }
}

export function edgeStrength(distance: number) {
  // Keep the spatial S-curve, but let its strength visibly fall as soon as the edge approaches.
  const progress = Math.min(1, Math.max(0, distance / 200))
  return progress ** 1.5
}

// Flat slopes at both ends avoid a visible seam against fully opaque content.
function smootherStep(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function createMask(direction: 'right' | 'bottom') {
  const width = direction === 'right' ? 40 : 32
  const stops = Array.from({ length: 17 }, (_, index) => {
    const t = index / 16
    return { position: t * width, strength: Number((1 - smootherStep(t)).toFixed(5)) }
  })
  const start = stops.map(
    ({ position, strength }) =>
      `rgb(0 0 0 / calc(1 - var(--broadcast-fade-start) * ${strength})) ${position}px`,
  )
  const end = [...stops]
    .reverse()
    .map(
      ({ position, strength }) =>
        `rgb(0 0 0 / calc(1 - var(--broadcast-fade-end) * ${strength})) calc(100% - ${position}px)`,
    )
  return `linear-gradient(to ${direction}, ${[...start, ...end].join(', ')})`
}

const edgeMasks = { right: createMask('right'), bottom: createMask('bottom') }

export function scrollEdgeMask(
  direction: 'right' | 'bottom',
  start: number,
  end: number,
): CSSProperties {
  return {
    '--broadcast-fade-start': start,
    '--broadcast-fade-end': end,
    maskImage: edgeMasks[direction],
  } as CSSProperties
}
