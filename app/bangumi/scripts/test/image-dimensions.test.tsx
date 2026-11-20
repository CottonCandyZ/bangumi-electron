// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { CoverMotionImage } from '../../src/renderer/src/components/image/cover-motion-image'
import { Image } from '../../src/renderer/src/components/image/image'

const disk = vi.hoisted(() => new Map<string, unknown>())

vi.mock('idb-keyval', () => ({
  createStore: vi.fn(),
  get: async (key: string) => structuredClone(disk.get(key)),
  update: async (key: string, apply: (value: unknown) => unknown) => {
    disk.set(key, structuredClone(apply(structuredClone(disk.get(key)))))
  },
}))

beforeEach(() => {
  disk.clear()
  vi.useFakeTimers()
})

afterEach(async () => {
  cleanup()
  await vi.runOnlyPendingTimersAsync()
  vi.useRealTimers()
})

function loadImage(image: HTMLImageElement, width: number, height: number) {
  Object.defineProperties(image, {
    naturalWidth: { value: width, configurable: true },
    naturalHeight: { value: height, configurable: true },
  })
  fireEvent.load(image)
}

test('a detail cover reserves the ratio learned from a carousel cover before loading', async () => {
  const path = '/pic/cover/l/fixtures/album.jpg'
  const thumbnail = render(<CoverMotionImage imageSrc={`https://lain.bgm.tv/r/800${path}`} />)
  loadImage(thumbnail.container.querySelector('img')!, 800, 800)
  thumbnail.unmount()

  const detailSrc = `https://lain.bgm.tv/r/400${path}`
  const detail = render(<Image imageSrc={detailSrc} fallbackAspectRatio="2 / 3" />)
  expect(detail.container.querySelector('img')!.style.aspectRatio).toBe('auto 800 / 800')
  detail.unmount()

  await vi.runOnlyPendingTimersAsync()
  vi.resetModules()
  const cache = await import('../../src/renderer/src/components/image/image-dimensions')
  await cache.restoreImageDimensions()
  expect(cache.getImageLayoutDimensions(detailSrc)).toEqual({ width: 800, height: 800 })
})

test('a portrait does not inherit a cropped thumbnail or a previous image version', () => {
  const src = 'https://lain.bgm.tv/pic/crt/l/fixtures/character.jpg'
  const grid = render(<Image imageSrc={src.replace('/l/', '/g/') + '?r=1'} />)
  loadImage(grid.container.querySelector('img')!, 64, 64)
  grid.unmount()

  const detail = render(<Image imageSrc={src + '?r=1'} fallbackAspectRatio="3 / 4" />)
  const original = detail.container.querySelector('img')!
  expect(original.style.aspectRatio).toBe('auto 3 / 4')
  loadImage(original, 400, 600)
  expect(original.style.aspectRatio).toBe('auto 400 / 600')

  detail.rerender(<Image imageSrc={src + '?r=2'} fallbackAspectRatio="3 / 4" />)
  expect(detail.container.querySelector('img')!.style.aspectRatio).toBe('auto 3 / 4')
})

test('loading a replacement at the same URL updates the next visit and the saved dimensions', async () => {
  const src = 'https://lain.bgm.tv/pic/crt/l/fixtures/person.jpg'
  const first = render(<Image imageSrc={src} fallbackAspectRatio="3 / 4" />)
  loadImage(first.container.querySelector('img')!, 300, 400)
  first.unmount()

  const replacement = render(<Image imageSrc={src} fallbackAspectRatio="3 / 4" />)
  loadImage(replacement.container.querySelector('img')!, 600, 300)
  replacement.unmount()

  const next = render(<Image imageSrc={src} fallbackAspectRatio="3 / 4" />)
  expect(next.container.querySelector('img')!.style.aspectRatio).toBe('auto 600 / 300')
  await vi.runOnlyPendingTimersAsync()
  vi.resetModules()
  const cache = await import('../../src/renderer/src/components/image/image-dimensions')
  await cache.restoreImageDimensions()
  expect(cache.getImageLayoutDimensions(src)).toEqual({ width: 600, height: 300 })
})
