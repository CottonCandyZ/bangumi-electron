import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, test, vi } from 'vitest'
import { CollectionPendingError } from '../../src/renderer/src/lib/utils/network'
import { EpisodesGrid } from '../../src/renderer/src/modules/common/episodes/grid'

const fixture = vi.hoisted(() => ({
  data: [] as unknown[] | null,
  loggedIn: false,
  loaded: true,
  error: null as Error | null,
  online: true,
  refetch: vi.fn(),
}))
vi.mock('@renderer/state/app-config', async () => {
  const { atom } = await import('jotai')
  const { DEFAULT_APP_CONFIG } = await import('../../src/shared/config')
  return { appConfigAtom: atom(DEFAULT_APP_CONFIG) }
})
vi.mock('@renderer/data/hooks/session', () => ({
  useSession: () => (fixture.loggedIn ? { id: 1 } : null),
}))
vi.mock('@renderer/hooks/use-online', () => ({ useOnline: () => fixture.online }))
vi.mock('@renderer/data/hooks/api/collection', () => ({
  useCollectionEpisodesInfoBySubjectIdQuery: () => ({
    data: fixture.loaded ? { data: fixture.data, total: 0 } : undefined,
    isError: fixture.error !== null,
    error: fixture.error,
    refetch: fixture.refetch,
  }),
}))
vi.mock('@renderer/data/hooks/api/episodes', () => ({
  useEpisodesInfoBySubjectIdQuery: () => ({
    data: fixture.loaded ? { data: fixture.data, total: 0 } : undefined,
    isError: fixture.error !== null,
    error: fixture.error,
    refetch: fixture.refetch,
  }),
}))
vi.mock('@renderer/modules/common/episodes/use-open-subject-episodes-panel', () => ({
  useOpenSubjectEpisodesPanel: () => ({ canOpen: false }),
}))
vi.mock('@renderer/modules/panel/left-panel/open-mono-list-panel', () => ({
  OpenMonoListPanelButton: () => null,
}))
vi.mock('@renderer/modules/common/episodes/grid/content', () => ({
  EpisodeGridContent: () => null,
}))
vi.mock('@renderer/modules/common/episodes/carousel', () => ({
  EpisodeCarousel: () => null,
}))
vi.mock('@renderer/modules/common/episodes/progress-editor', () => ({
  EpisodeProgressEditor: () => null,
}))
vi.mock('@renderer/modules/common/episodes/grid/page-selector', () => ({
  PageSelector: () => null,
  PageSelectorSkeleton: () => null,
}))

test.each([[], null])('empty episode responses render no heading or controls (%s)', (data) => {
  fixture.data = data
  expect(renderToStaticMarkup(createElement(EpisodesGrid, { subjectId: '1', eps: 0 }))).toBe('')
})

beforeEach(() => {
  fixture.loggedIn = false
  fixture.loaded = true
  fixture.data = []
  fixture.error = null
  fixture.online = true
})
test.each([false, true])('unloaded episodes show a skeleton (logged in: %s)', (loggedIn) => {
  fixture.loggedIn = loggedIn
  fixture.loaded = false
  const html = renderToStaticMarkup(createElement(EpisodesGrid, { subjectId: '1', eps: 0 }))
  expect(html).toContain('章节')
  expect(html).toContain('animate-pulse')
})
test('loaded empty collection episodes hide the entire section', () => {
  fixture.loggedIn = true
  expect(renderToStaticMarkup(createElement(EpisodesGrid, { subjectId: '1', eps: 8 }))).toBe('')
})

test.each(['small', 'default'] as const)(
  'episodes waiting for collection sync keep the %s skeleton',
  (size) => {
    fixture.loggedIn = true
    fixture.loaded = false
    fixture.error = new CollectionPendingError()
    const html = renderToStaticMarkup(createElement(EpisodesGrid, { subjectId: '1', eps: 8, size }))
    expect(html).toContain('data-slot="skeleton"')
    expect(html).not.toContain('data-query-fallback')
    expect(html).not.toContain('重试')
  },
)

test.each(['small', 'default'] as const)(
  'failed episode requests still show a retry action in the %s view',
  (size) => {
    fixture.loggedIn = true
    fixture.loaded = false
    fixture.error = new Error('同步失败')
    const html = renderToStaticMarkup(createElement(EpisodesGrid, { subjectId: '1', eps: 8, size }))
    expect(html).toContain('章节暂时无法加载')
    expect(html).toContain('重试')
    expect(html).not.toContain('data-slot="skeleton"')
  },
)

test('uncached episodes show the offline fallback when collection sync cannot continue', () => {
  fixture.loggedIn = true
  fixture.loaded = false
  fixture.error = new CollectionPendingError()
  fixture.online = false
  const html = renderToStaticMarkup(
    createElement(EpisodesGrid, { subjectId: '1', eps: 8, size: 'small' }),
  )
  expect(html).toContain('章节尚未缓存')
  expect(html).toContain('等待联网')
  expect(html).not.toContain('data-slot="skeleton"')
})
