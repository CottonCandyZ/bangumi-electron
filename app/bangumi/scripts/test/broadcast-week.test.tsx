// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import type { ReactNode } from 'react'
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { PageScrollWrapper } from '../../src/renderer/src/components/scroll/page-scroll-wrapper'
import type { Calendar, CalendarItem } from '../../src/renderer/src/data/types/calendar'
import { BroadcastWeek } from '../../src/renderer/src/modules/main/calendar'
import { broadcastSortAtom } from '../../src/renderer/src/modules/main/home/broadcast-controls'
import { watchingOnlyAtom } from '../../src/renderer/src/modules/main/home/broadcast-schedule'
import { userIdAtom } from '../../src/renderer/src/state/session'

const calendarQuery = {
  data: {} as Calendar | undefined,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
}
const watchingQuery = {
  data: [] as number[] | undefined,
  isError: false,
  error: null,
  refetch: vi.fn(),
}
let online = true
const scrollToDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTo')

vi.mock('../../src/renderer/src/data/hooks/api/calendar', () => ({
  useCalendarQuery: () => calendarQuery,
}))
vi.mock('../../src/renderer/src/data/collection/watching', () => ({
  useWatchingSubjectIds: () => watchingQuery,
}))
vi.mock('../../src/renderer/src/hooks/use-online', () => ({
  useOnline: () => online,
}))
vi.mock('../../src/renderer/src/components/my-link', () => ({
  MyLink: ({ children, to }: { children: ReactNode; to: string }) => (
    <Link to={to}>{children}</Link>
  ),
}))
vi.mock('../../src/renderer/src/components/query-fallback', () => ({
  QueryFallback: ({ label }: { label: string }) => <div role="status">{label}</div>,
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 28, 12))
  localStorage.clear()
  calendarQuery.data = {}
  calendarQuery.isLoading = false
  calendarQuery.isError = false
  watchingQuery.data = []
  watchingQuery.isError = false
  online = true
  vi.stubGlobal(
    'ResizeObserver',
    vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })),
  )
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(500)
  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(1760)
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const parent = this.parentElement
    const index = parent ? Array.from(parent.children).indexOf(this) : -1
    const left =
      parent?.getAttribute('aria-label') === '一周放送' ? 24 + index * 248 - parent.scrollLeft : 0
    const width = parent?.getAttribute('aria-label') === '一周放送' ? 224 : 500
    return new DOMRect(left, 0, width, 400)
  })
  Object.defineProperty(Element.prototype, 'scrollTo', {
    configurable: true,
    value: vi.fn(function (this: Element, options: ScrollToOptions) {
      if (options.left !== undefined) this.scrollLeft = options.left
      if (options.top !== undefined) this.scrollTop = options.top
    }),
  })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  if (scrollToDescriptor) Object.defineProperty(Element.prototype, 'scrollTo', scrollToDescriptor)
  else delete (Element.prototype as Partial<Element>).scrollTo
  localStorage.clear()
})

function fixture({ watchingOnly = false, signedIn = false, pageWrapper = false } = {}) {
  const store = createStore()
  store.set(watchingOnlyAtom, watchingOnly)
  store.set(userIdAtom, signedIn ? '1' : null)
  store.set(broadcastSortAtom, 'watchers')
  const router = createMemoryRouter([
    {
      path: '/',
      element: pageWrapper ? (
        <PageScrollWrapper>
          <BroadcastWeek />
        </PageScrollWrapper>
      ) : (
        <BroadcastWeek />
      ),
    },
  ])
  const view = render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  return { ...view, store }
}

test.each(['signed out', 'watching failed', 'offline'] as const)(
  'initializes scrolling when the grid appears after being %s',
  (state) => {
    if (state === 'watching failed') watchingQuery.isError = true
    if (state === 'offline') {
      online = false
      calendarQuery.data = undefined
      calendarQuery.isLoading = true
    }
    fixture({ watchingOnly: state !== 'offline', signedIn: state === 'watching failed' })
    expect(screen.queryByRole('region', { name: '一周放送' })).toBeNull()

    if (state === 'offline') {
      online = true
      // Trigger a render while calendar data is still pending.
      fireEvent.click(screen.getByRole('button', { name: '评分' }))
    } else {
      fireEvent.click(screen.getByRole('button', { name: '只看在追' }))
    }

    const scroller = screen.getByRole('region', { name: '一周放送' })
    expect(scroller.scrollLeft).toBe(520)
    expect(
      (screen.getByRole('button', { name: '向前浏览放送' }) as HTMLButtonElement).disabled,
    ).toBe(false)
    expect(
      (screen.getByRole('button', { name: '向后浏览放送' }) as HTMLButtonElement).disabled,
    ).toBe(false)
    scroller.scrollLeft = 0
    fireEvent.scroll(scroller)
    expect(
      (screen.getByRole('button', { name: '向前浏览放送' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  },
)

test('rebinds navigation after the filter hides a visible grid behind the login prompt', () => {
  fixture()
  fireEvent.click(screen.getByRole('button', { name: '只看在追' }))
  expect(screen.queryByRole('region', { name: '一周放送' })).toBeNull()
  expect(screen.queryByRole('button', { name: '向后浏览放送' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '只看在追' }))
  const second = screen.getByRole('region', { name: '一周放送' })
  second.scrollLeft = second.scrollWidth - second.clientWidth
  fireEvent.scroll(second)
  expect((screen.getByRole('button', { name: '向后浏览放送' }) as HTMLButtonElement).disabled).toBe(
    true,
  )
})

test('horizontal wheel events remain scrollable inside the page viewport', () => {
  fixture({ pageWrapper: true })
  const scroller = screen.getByRole('region', { name: '一周放送' })
  const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: 100 })
  fireEvent(scroller, wheel)
  expect(wheel.defaultPrevented).toBe(false)

  const outerWheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: 100 })
  fireEvent(scroller.parentElement!, outerWheel)
  expect(outerWheel.defaultPrevented).toBe(true)
})

function item(id: number, watchers: number, score: number): CalendarItem {
  return {
    watchers,
    subject: {
      id,
      name: `Subject ${id}`,
      nameCN: '',
      type: 2,
      info: '',
      locked: false,
      nsfw: false,
      rating: { rank: 0, total: 0, score, count: [] },
    },
  }
}

test('switches between watcher and rating order without mutating cached data', () => {
  const items = [item(1, 10, 9), item(2, 20, 7), item(3, 5, 0)]
  calendarQuery.data = { '3': items }
  const { store } = fixture()
  const titles = () =>
    within(screen.getByRole('region', { name: '周三放送' }))
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
  expect(titles()).toEqual(['/subject/2', '/subject/1', '/subject/3'])
  fireEvent.click(screen.getByRole('button', { name: '评分' }))
  expect(titles()).toEqual(['/subject/1', '/subject/2', '/subject/3'])
  expect(store.get(broadcastSortAtom)).toBe('score')
  expect(items.map((entry) => entry.subject.id)).toEqual([1, 2, 3])
})
