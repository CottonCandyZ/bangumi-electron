import { Pagination } from '@renderer/data/types/bgm'
import { Episode } from '@renderer/data/types/episode'
import type { SlimIndex, P1SlimMono } from '@renderer/data/types/index'
import type { P1SlimSubject } from '@renderer/data/types/subject'
import { SlimSubject, SubjectType } from '@renderer/data/types/subject'

export type Collections = {
  data: CollectionData[]
} & Pagination

export type CollectionData = {
  updated_at: string
  comment: string | null
  tags: string[]
  subject: SlimSubject
  subject_id: number
  vol_status: number
  ep_status: number
  subject_type: SubjectType
  type: CollectionType
  rate: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  private: boolean
}

export type CollectionEpisodes = {
  data: CollectionEpisode[] | null
} & Pagination

export type P1CollectionResourceType = 'subject' | 'character' | 'person' | 'index'
export type P1ToggleCollectionResourceType = Exclude<P1CollectionResourceType, 'subject'>

export type MonoResourceCollection = {
  created_at: string
  id: number
  name: string
  type: number
}

export type P1CollectionItemMap = {
  subject: P1SlimSubject
  character: P1SlimMono
  person: P1SlimMono
  index: SlimIndex
}

export type P1CollectionPage<T extends P1CollectionResourceType> = {
  data: P1CollectionItemMap[T][]
  total: number
}

export type CollectionEpisode = {
  episode: Episode
  type: EpisodeCollectionType
}

export enum EpisodeCollectionType {
  'notCollected' = 0,
  'wantToWatch',
  'watched',
  'abandoned',
}

export enum CollectionType {
  'wantToWatch' = 1,
  'watched',
  'watching',
  'aside',
  'abandoned',
}
