import { CollectionType } from '@renderer/data/types/collection'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

const sidePanelCollectionTypeFilterMapAtom = atom(new Map<string, CollectionType>())

export const sidePanelShowEpisodeListAtom = atomWithStorage('side-panel-show-episode-list', true)

export const sidePanelOneBasedEpisodeSortAtom = atomWithStorage(
  'side-panel-one-based-episode-sort',
  false,
)

export const sidePanelCollectionTypeFilterAtom = atom(
  (get) => {
    return get(sidePanelCollectionTypeFilterMapAtom)
  },
  (get, set, id: string, value: CollectionType) => {
    set(
      sidePanelCollectionTypeFilterMapAtom,
      new Map(get(sidePanelCollectionTypeFilterMapAtom)).set(id, value),
    )
  },
)
