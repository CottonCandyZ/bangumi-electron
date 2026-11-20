// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { createContext, useContext, type ReactNode } from 'react'
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { SubjectType, type Subject } from '../../src/renderer/src/data/types/subject'
import type { SectionPath } from '../../src/renderer/src/data/types/web'
import { HomeHero } from '../../src/renderer/src/modules/main/home/home-hero'
import { otherCache } from '../../src/renderer/src/state/global-var'
import { userIdAtom } from '../../src/renderer/src/state/session'

const AnimeHeadContext = createContext<Subject[] | undefined>(undefined)
const pendingImages = new Map<string, Promise<void>>()

vi.mock('../../src/renderer/src/modules/main/category/use-trending-subjects', () => ({
  useTrendingSubjects: (section: SectionPath) => {
    const animeHead = useContext(AnimeHeadContext)
    return { heroSubjects: section === 'anime' ? animeHead : [], failed: false }
  },
}))

vi.mock('../../src/renderer/src/components/my-link', () => ({
  MyLink: ({ children, to, tabIndex }: { children: ReactNode; to: string; tabIndex: number }) => (
    <Link to={to} tabIndex={tabIndex}>
      {children}
    </Link>
  ),
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(900)
  vi.stubGlobal(
    'ResizeObserver',
    vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })),
  )
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() })),
  )
  vi.stubGlobal(
    'Image',
    class {
      src = ''

      decode() {
        return pendingImages.get(this.src) ?? Promise.resolve()
      }
    },
  )
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  otherCache.clear()
  pendingImages.clear()
  localStorage.clear()
})

function subject(id: number): Subject {
  return {
    id,
    name: `Subject ${id}`,
    name_cn: '',
    type: SubjectType.anime,
    images: {
      large: `/cover-${id}.jpg`,
      small: `/backdrop-${id}.jpg`,
      grid: '',
      medium: '',
      common: '',
    },
    date: null,
    platform: '',
    summary: '',
    infobox: [],
    ratingCount: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
    rating: { rank: 0, total: 0, score: 0 },
    tags: [],
    total_episodes: 0,
    collection: { on_hold: 0, dropped: 0, wish: 0, collect: 0, doing: 0 },
    eps: 0,
    volumes: 0,
    series: false,
    locked: false,
    nsfw: false,
    last_update_at: new Date(),
  }
}

function holdCover(src: string) {
  let finish!: () => void
  pendingImages.set(
    src,
    new Promise<void>((resolve) => {
      finish = resolve
    }),
  )
  return finish
}

function fixture(head: Subject[], userId: string | null = null) {
  const store = createStore()
  store.set(userIdAtom, userId)
  const router = createMemoryRouter([{ path: '/', element: <HomeHero /> }])
  const page = (subjects: Subject[] | undefined) => (
    <Provider store={store}>
      <AnimeHeadContext.Provider value={subjects}>
        <RouterProvider router={router} />
      </AnimeHeadContext.Provider>
    </Provider>
  )
  const view = render(page(head))
  return { ...view, store, setHead: (subjects?: Subject[]) => view.rerender(page(subjects)) }
}

const carouselRole = { name: '热门条目' }

test('keeps the mounted banner until the refreshed list and its covers are ready', async () => {
  const first = subject(1)
  const second = subject(2)
  const incoming = subject(3)
  const finishFirst = holdCover(first.images.large)
  const finishIncoming = holdCover(incoming.images.large)
  const { container, setHead } = fixture([first, second])

  expect(screen.queryByRole('region', carouselRole)).toBeNull()
  expect(container.querySelector('[data-slot=skeleton]')).not.toBeNull()
  await act(async () => finishFirst())

  const banner = screen.getByRole('region', carouselRole)
  setHead()
  expect(screen.getByRole('region', carouselRole)).toBe(banner)

  setHead([second, incoming])
  expect(screen.getByRole('region', carouselRole)).toBe(banner)
  expect(banner.querySelector('a[href="/subject/2"]')?.textContent).toContain('动画热门 #2')
  expect(banner.querySelector('a[href="/subject/3"]')).toBeNull()
  await act(async () => finishIncoming())

  expect(screen.getByRole('region', carouselRole)).toBe(banner)
  expect(banner.querySelector('a[href="/subject/1"]')).toBeNull()
  expect(banner.querySelector('a[href="/subject/2"]')?.textContent).toContain('动画热门 #1')
  const incomingSlide = banner
    .querySelector('a[href="/subject/3"]')
    ?.closest<HTMLElement>('[aria-roledescription=slide]')
  expect(incomingSlide?.style.width).toMatch(/px$/)
})

test('preloads an updated cover for the same subject', async () => {
  const original = subject(4)
  const newCover = '/replacement-cover.jpg'
  const finishCover = holdCover(newCover)
  const { setHead } = fixture([original])
  await act(async () => undefined)

  const image = screen.getByRole('region', carouselRole).querySelector('img')
  setHead([{ ...original, images: { ...original.images, large: newCover } }])
  expect(image?.getAttribute('src')).toBe(original.images.large)
  await act(async () => finishCover())
  expect(image?.getAttribute('src')).toBe(newCover)
})

test('clears the retained banner when the account changes', async () => {
  const { setHead, store } = fixture([subject(5)], '123')
  await act(async () => undefined)
  setHead()
  expect(screen.getByRole('region', carouselRole)).toBeTruthy()

  act(() => store.set(userIdAtom, null))
  expect(screen.queryByRole('region', carouselRole)).toBeNull()
})
