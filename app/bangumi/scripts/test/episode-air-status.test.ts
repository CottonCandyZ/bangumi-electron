import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { CollectionEpisode } from '../../src/shared/types/collection'
import { getOnAirStatus } from '../../src/renderer/src/lib/utils/date'
import { EpisodeGridItem } from '../../src/renderer/src/modules/common/episodes/grid/item'

vi.mock('@renderer/components/hover-card/trigger', () => ({
  HoverCardTrigger: ({ children }) => children,
}))
vi.mock('@renderer/state/hover-card', async () => {
  const { atom } = await import('jotai')
  return {
    hoverCardEpisodeContentAtom: atom(null),
    hoverCardOpenAtom: atom(false),
    closeHoverCardImmediatelyAtomAction: atom(null, () => {}),
  }
})
vi.mock('@renderer/modules/common/collections/use-episode-collection-actions', () => ({
  useEpisodeCollectionActions: () => ({ currentAction: null, isPending: false }),
}))
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 9, 23, 59, 59))
})
afterEach(() => vi.useRealTimers())

const episodes: CollectionEpisode[] = [
  {
    type: 0,
    episode: {
      id: 2,
      sort: 2,
      ep: 2,
      subject_id: 42,
      type: 0,
      airdate: '2026-10-10',
      name: '',
      name_cn: '',
      desc: '',
      duration: '',
      duration_seconds: 0,
      disc: 0,
      comment: 0,
    },
  },
]

function renderEpisode(dataUpdatedAt: number, size: 'small' | 'default') {
  return renderToStaticMarkup(
    createElement(EpisodeGridItem, { episodes, dataUpdatedAt, size, index: 0, collectionType: 3 }),
  )
}

test('airing status follows the snapshot calendar date and preserves undated episodes', () => {
  const referenceTime = new Date(2026, 9, 10, 12).getTime()
  expect(getOnAirStatus('2026-10-09', referenceTime)).toBe('aired')
  expect(getOnAirStatus('2026-10-10', referenceTime)).toBe('onAir')
  expect(getOnAirStatus('2026-10-11', referenceTime)).toBe('noAired')
  expect(getOnAirStatus('', referenceTime)).toBe('aired')
  expect(getOnAirStatus('invalid', referenceTime)).toBe('aired')
})

test('sidebar and main buttons use the same cached snapshot and refresh together', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })
  const queryFn = vi.fn(async () => ({ data: episodes }))
  const options = {
    queryKey: ['collection-episodes', 1, { subjectId: '42' }],
    queryFn,
    staleTime: Infinity,
  }
  await client.fetchQuery(options)
  const sidebar = new QueryObserver(client, options)
  const unmountSidebar = sidebar.subscribe(() => {})
  vi.setSystemTime(new Date(2026, 9, 10, 12))
  const main = new QueryObserver(client, options)
  const unmountMain = main.subscribe(() => {})

  try {
    const originalData = sidebar.getCurrentResult().data
    expect(main.getCurrentResult().data).toBe(originalData)
    expect(main.getCurrentResult().dataUpdatedAt).toBe(sidebar.getCurrentResult().dataUpdatedAt)
    expect(renderEpisode(sidebar.getCurrentResult().dataUpdatedAt, 'small')).not.toContain(
      'bg-foreground/2.5',
    )
    expect(renderEpisode(main.getCurrentResult().dataUpdatedAt, 'default')).not.toContain(
      'bg-foreground/2.5',
    )
    expect(queryFn).toHaveBeenCalledTimes(1)

    // The raw episode data can stay identical while the shared snapshot becomes current.
    await main.refetch()
    expect(sidebar.getCurrentResult().data).toBe(originalData)
    expect(sidebar.getCurrentResult().dataUpdatedAt).toBe(new Date(2026, 9, 10, 12).getTime())
    expect(main.getCurrentResult().dataUpdatedAt).toBe(sidebar.getCurrentResult().dataUpdatedAt)
    expect(renderEpisode(sidebar.getCurrentResult().dataUpdatedAt, 'small')).toContain(
      'bg-foreground/2.5',
    )
    expect(renderEpisode(main.getCurrentResult().dataUpdatedAt, 'default')).toContain(
      'bg-foreground/2.5',
    )
  } finally {
    unmountSidebar()
    unmountMain()
    client.clear()
  }
})
