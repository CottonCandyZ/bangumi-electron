import { expect, test } from 'vitest'
import {
  findEpisodeByInput,
  getEpisodeProgress,
  getEpisodePage,
  getWatchedThroughEpisodes,
} from '../../src/renderer/src/data/collection/episode-progress'
import { CollectionEpisode, EpisodeCollectionType } from '../../src/shared/types/collection'
import { EpisodeType } from '../../src/shared/types/episode'

function episode(
  sort: number,
  type = EpisodeCollectionType.notCollected,
  kind = EpisodeType.本篇,
): CollectionEpisode {
  return {
    type,
    episode: {
      id: kind * 10000 + sort * 10,
      sort,
      ep: sort,
      subject_id: 42,
      type: kind,
      name: '',
      name_cn: '',
      desc: '',
      duration: '',
      duration_seconds: 0,
      airdate: '',
      disc: 0,
      comment: 0,
    },
  }
}

test('resume locates the last watched main episode, not an unwatched episode or a special', () => {
  const data = [
    episode(78, 2),
    episode(79),
    episode(80, 2),
    episode(81, 3),
    episode(82, 1),
    episode(1, 2, EpisodeType.SP),
  ]
  const progress = getEpisodeProgress(data)
  expect(progress.anchor?.episode.sort).toBe(80)
  expect(progress.lastWatched?.episode.sort).toBe(80)
  expect(progress.main).toHaveLength(5)
})

test('new, empty, and completed collections have stable anchors', () => {
  expect(getEpisodeProgress([]).anchor).toBeUndefined()
  expect(getEpisodeProgress([episode(2), episode(1)]).anchor?.episode.sort).toBe(1)
  const complete = getEpisodeProgress([episode(1, 2), episode(2, 2)])
  expect(complete.anchor?.episode.sort).toBe(2)
})

test('long series resume beyond the first 100 episodes', () => {
  const data = Array.from({ length: 230 }, (_, index) => episode(index + 1, index < 205 ? 2 : 0))
  expect(getEpisodeProgress(data).anchor?.episode.sort).toBe(205)
  const page = getEpisodePage({
    episodes: data,
    collection: true,
    requestedOffset: null,
    compact: false,
  })
  expect(page.offset).toBe(200)
  expect(page.episodes).toHaveLength(30)
  expect(page.episodes[0]).toBe(data[200])
  expect(
    getEpisodePage({ episodes: data, collection: true, requestedOffset: 100, compact: false })
      .offset,
  ).toBe(100)
  expect(
    getEpisodePage({ episodes: data, collection: true, requestedOffset: null, compact: true })
      .offset,
  ).toBe(0)
})

test('guest pages are already paginated and retain the original season start', () => {
  const data = [episode(278).episode, episode(279).episode]
  const page = getEpisodePage({
    episodes: data,
    collection: false,
    requestedOffset: 200,
    compact: false,
  })
  expect(page.episodes).toEqual(data)
  expect(page.episodeSortStart).toBe(78)
})

test('numeric entry follows original or one-based season numbering, including decimals', () => {
  const data = [episode(78), episode(79), episode(79.5), episode(80)]
  const offset =
    1 -
    getEpisodePage({ episodes: data, collection: true, requestedOffset: null, compact: false })
      .episodeSortStart
  expect(offset).toBe(-77)
  expect(findEpisodeByInput(data, '3', offset)?.episode.sort).toBe(80)
  expect(findEpisodeByInput(data, '2.5', offset)?.episode.sort).toBe(79.5)
  expect(findEpisodeByInput(data, '79', 0)?.episode.sort).toBe(79)
  for (const input of ['', ' ', 'NaN', 'Infinity', '-1', '0', '81', '78.5']) {
    expect(findEpisodeByInput(data, input, 0)).toBeUndefined()
  }
})

test('seen-through spans pages, fills gaps, and preserves dropped, later and special episodes', () => {
  const data = Array.from({ length: 205 }, (_, index) => episode(index + 1, index < 3 ? 2 : 0))
  data[50].type = EpisodeCollectionType.abandoned
  data[60].type = EpisodeCollectionType.wantToWatch
  data.push(episode(1, 0, EpisodeType.SP), episode(1, 0, EpisodeType.OP))
  const changed = getWatchedThroughEpisodes(data, data[201].episode.id)
  expect(changed).toHaveLength(198)
  expect(changed[0].episode.sort).toBe(4)
  expect(changed.at(-1)?.episode.sort).toBe(202)
  expect(changed.some((item) => item.episode.sort === 61)).toBe(true)
  expect(changed.every((item) => item.episode.type === EpisodeType.本篇 && item.type !== 3)).toBe(
    true,
  )
  expect(data[50].type).toBe(3)
})

test('special seen-through actions stay in their own kind; missing targets are no-ops', () => {
  const data = [
    episode(1),
    episode(2),
    episode(1, 0, EpisodeType.SP),
    episode(2, 0, EpisodeType.SP),
  ]
  expect(
    getWatchedThroughEpisodes(data, data[3].episode.id).map((item) => item.episode.type),
  ).toEqual([1, 1])
  expect(getWatchedThroughEpisodes(data, -1)).toEqual([])
})
