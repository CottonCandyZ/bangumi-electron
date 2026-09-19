import { atomWithStorage } from 'jotai/utils'

export const episodeViewModeAtom = atomWithStorage<'grid' | 'cards'>('episode-view-mode', 'grid')
