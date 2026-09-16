import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, test, vi } from 'vitest'
import { EpisodesGrid } from '../../src/renderer/src/modules/common/episodes/grid'

const fixture = vi.hoisted(() => ({ data: [] as unknown[] | null, loggedIn: false, loaded: true }))
vi.mock('@renderer/data/hooks/session', () => ({
  useSession: () => (fixture.loggedIn ? { id: 1 } : null),
}))
vi.mock('@renderer/data/hooks/api/collection', () => ({
  useCollectionEpisodesInfoBySubjectIdQuery: () => ({
    data: fixture.loaded ? { data: fixture.data, total: 0 } : undefined,
  }),
}))
vi.mock('@renderer/data/hooks/api/episodes', () => ({
  useEpisodesInfoBySubjectIdQuery: () => ({
    data: fixture.loaded ? { data: fixture.data, total: 0 } : undefined,
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
