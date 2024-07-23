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
  rate: number
  private: false
}

export type CollectionEpisodes = {
  data: CollectionEpisode[]
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
  '想看' = 1,
  '看过',
  '在看',
  '搁置',
  '抛弃',
}
