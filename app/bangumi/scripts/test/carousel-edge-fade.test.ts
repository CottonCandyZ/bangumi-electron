import { expect, test } from 'vitest'
import type { CarouselApi } from '../../src/renderer/src/components/ui/carousel'
import { carouselEdgeDistances } from '../../src/renderer/src/modules/main/home/carousel-edge-fade'

test('edge distances use engine bounds, independently of DOM gutters and snap selection', () => {
  let position = -150
  let min = -300
  const api = {
    internalEngine: () => ({ location: { get: () => position }, limit: { min, max: 0 } }),
    containerNode: () => {
      throw new Error('DOM overflow is not the scroll range')
    },
    selectedScrollSnap: () => 0,
  } as unknown as NonNullable<CarouselApi>
  expect(carouselEdgeDistances(api)).toEqual({ start: 150, end: 150 })
  position = -300
  expect(carouselEdgeDistances(api)).toEqual({ start: 300, end: 0 })
  position = -320
  expect(carouselEdgeDistances(api)).toEqual({ start: 300, end: 0 })
  position = 20
  expect(carouselEdgeDistances(api)).toEqual({ start: 0, end: 300 })
  min = 0
  expect(carouselEdgeDistances(api)).toEqual({ start: 0, end: 0 })
})
