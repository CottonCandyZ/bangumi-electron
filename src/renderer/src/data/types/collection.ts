import { Pagination } from '@renderer/data/types/bgm'
import { Episode } from '@renderer/data/types/episode'
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
