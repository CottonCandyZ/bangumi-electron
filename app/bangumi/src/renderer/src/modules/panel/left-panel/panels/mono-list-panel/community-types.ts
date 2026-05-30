import type { CommunityTopic, SlimGroup } from '@renderer/data/types/community'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'

export type CommunityTopicPage = {
  data: CommunityTopic[]
  total: number
}

export type CommunityTopicQuery = UseInfiniteQueryResult<
  InfiniteData<CommunityTopicPage, number>,
  Error
>

export type CommunityGroupPage = {
  data: SlimGroup[]
  total: number
}

export type CommunityGroupQuery = UseInfiniteQueryResult<
  InfiniteData<CommunityGroupPage, number>,
  Error
>
