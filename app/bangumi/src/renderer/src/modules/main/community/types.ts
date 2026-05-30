import type { CommunityTopic, CommunityTopicKind } from '@renderer/data/types/community'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'

export type CommunityTopicPage = {
  data: CommunityTopic[]
  total: number
}

export type CommunityTopicQuery = UseInfiniteQueryResult<
  InfiniteData<CommunityTopicPage, number>,
  Error
>

export type CommunityOverviewSection = {
  description: string
  groupMode?: 'all' | 'joined'
  id: string
  panelTitle: string
  title: string
  topicKind: CommunityTopicKind
}
