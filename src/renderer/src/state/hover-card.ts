import { CollectionEpisode, CollectionType } from '@renderer/data/types/collection'
import { Episode } from '@renderer/data/types/episode'
import { ModifyEpisodeCollectionOptType } from '@renderer/data/types/modify'
import { atom } from 'jotai'

export const hoverCardOpenAtom = atom(false)

let timeId: ReturnType<typeof setTimeout> | undefined

export const hoverCardOpenAtomAction = atom(
  null,
  (_get, set, value: boolean, closeDelay: number = 50, openDelay: number = 200) => {
    clearTimeout(timeId)
    if (!value) {
      timeId = setTimeout(() => set(hoverCardOpenAtom, value), closeDelay)
    } else timeId = setTimeout(() => set(hoverCardOpenAtom, value), openDelay)
  },
)

export const triggerClientRectAtom = atom<DOMRect | null>(null)

export const hoverCardContentTypeAtom = atom('episode')

export const hoverCardEpisodeContentAtom = atom<
  | ({
      index: number
      episodes: Episode[] | CollectionEpisode[]
      collectionType: CollectionType | undefined
      setEnabledForm: (enabled: boolean) => void
    } & ModifyEpisodeCollectionOptType)
  | null
>(null)
