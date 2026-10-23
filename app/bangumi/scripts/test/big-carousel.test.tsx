// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { BigCarousel } from '../../src/renderer/src/components/carousel/big-carousel'
import { otherCache } from '../../src/renderer/src/state/global-var'

beforeEach(() => {
  vi.useFakeTimers()
  otherCache.clear()
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(900)
  vi.stubGlobal(
    'ResizeObserver',
    vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })),
  )
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  otherCache.clear()
})

function fixture({ items = [0, 1, 2], autoPlay = true } = {}) {
  return (
    <MemoryRouter initialEntries={['/big-carousel-test']}>
      <BigCarousel
        label="Fixture"
        items={items}
        autoPlay={autoPlay}
        getKey={(item) => item}
        renderSlide={(item, { selected }) => (
          <a href="#fixture" tabIndex={selected ? 0 : -1}>
            Slide {item}
          </a>
        )}
      />
    </MemoryRouter>
  )
}

function advance(milliseconds: number) {
  act(() => vi.advanceTimersByTime(milliseconds))
}

function expectSelected(index: number) {
  expect(screen.getByRole('tab', { selected: true }).getAttribute('aria-label')).toBe(
    `跳转到第 ${index} 个`,
  )
}

test('autoplay waits six seconds and manual navigation restarts the delay', () => {
  render(fixture())
  advance(5999)
  expectSelected(1)
  advance(1)
  expectSelected(2)

  advance(3000)
  fireEvent.click(screen.getByRole('button', { name: '下一个Fixture' }))
  expectSelected(3)
  advance(5999)
  expectSelected(3)
  advance(1)
  expectSelected(1)
})

test('hover pauses autoplay and leaving resumes it while a manual control keeps focus', () => {
  render(fixture())
  const carousel = screen.getByRole('region', { name: 'Fixture' })
  const next = screen.getByRole('button', { name: '下一个Fixture' })
  fireEvent.pointerEnter(carousel)
  act(() => next.focus())
  fireEvent.click(next)
  advance(12000)
  expectSelected(2)

  fireEvent.pointerLeave(carousel)
  expect(document.activeElement).toBe(next)
  advance(5999)
  expectSelected(2)
  advance(1)
  expectSelected(3)
})

test('hiding the document pauses autoplay and showing it starts a new delay', () => {
  render(fixture())
  advance(3000)
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  fireEvent(document, new Event('visibilitychange'))
  advance(12000)
  expectSelected(1)

  hidden.mockReturnValue(false)
  fireEvent(document, new Event('visibilitychange'))
  advance(5999)
  expectSelected(1)
  advance(1)
  expectSelected(2)
})

test('disabled autoplay allows manual navigation and can be enabled later', () => {
  const { rerender } = render(fixture({ autoPlay: false }))
  advance(12000)
  expectSelected(1)
  fireEvent.click(screen.getByRole('button', { name: '下一个Fixture' }))
  expectSelected(2)

  rerender(fixture())
  advance(6000)
  expectSelected(3)
})

test('shrinking to a single slide restores selection and removes navigation', () => {
  const { rerender } = render(fixture())
  fireEvent.click(screen.getByRole('button', { name: '下一个Fixture' }))
  expectSelected(2)
  rerender(fixture({ items: [0] }))

  expect(screen.queryByRole('tablist')).toBeNull()
  expect(screen.queryByRole('button', { name: '下一个Fixture' })).toBeNull()
  expect(screen.getByRole('group').getAttribute('aria-current')).toBe('true')
  expect(screen.getByRole('link', { name: 'Slide 0' }).tabIndex).toBe(0)
  advance(12000)
  expect(screen.getByRole('link', { name: 'Slide 0' }).tabIndex).toBe(0)
})
