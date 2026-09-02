import type { MonoListPanelTab } from '@renderer/state/panel'
import {
  CommunityGroupsListPanelContent,
  CommunityGroupTopicsListPanelContent,
  CommunitySubjectTopicsListPanelContent,
  CommunityTopicsListPanelContent,
} from './community-content'
import { IndexRelatedListPanelContent, MonoIndexesListPanelContent } from './index-content'
import { MonoRelatedListPanelContent, MonoSubjectListPanelContent } from './mono-content'
import { SearchSubjectsListPanelContent } from './search-content'
import { SearchMonosListPanelContent } from './search-mono-content'
import { SiteTimelineListPanelContent } from './site-timeline-content'
import {
  SubjectCharacterListPanelContent,
  SubjectEpisodeListPanelContent,
  SubjectRelatedListPanelContent,
  SubjectTankobonListPanelContent,
} from './subject-content'
import { SubjectRecommendationsListPanelContent } from './subject-recommendation-content'
import { SubjectReviewsListPanelContent } from './subject-review-content'
import { TrendingSubjectsListPanelContent } from './trending-subjects-content'
import { UserCollectionsListPanelContent } from './user-collections-content'
import { UserFriendsListPanelContent } from './user-friends-content'

export function MonoListPanelContent({
  filtersOpen,
  tab,
}: {
  filtersOpen: boolean
  tab: MonoListPanelTab
}) {
  if (tab.type === 'subjects') {
    return <MonoSubjectListPanelContent filtersOpen={filtersOpen} tab={tab} />
  }
  if (tab.type === 'related') {
    return <MonoRelatedListPanelContent filtersOpen={filtersOpen} tab={tab} />
  }
  if (tab.type === 'subjectCharacters') {
    return <SubjectCharacterListPanelContent filtersOpen={filtersOpen} tab={tab} />
  }
  if (tab.type === 'subjectRelated') {
    return <SubjectRelatedListPanelContent filtersOpen={filtersOpen} tab={tab} />
  }
  if (tab.type === 'indexRelated') {
    return <IndexRelatedListPanelContent filtersOpen={filtersOpen} tab={tab} />
  }

  return <MonoListPanelContentGroupOne tab={tab} />
}

function MonoListPanelContentGroupOne({ tab }: { tab: MonoListPanelTab }) {
  if (tab.type === 'subjectTankobon') return <SubjectTankobonListPanelContent tab={tab} />
  if (tab.type === 'subjectEpisodes') return <SubjectEpisodeListPanelContent tab={tab} />
  if (tab.type === 'monoIndexes') return <MonoIndexesListPanelContent tab={tab} />
  if (tab.type === 'subjectRecommendations') {
    return <SubjectRecommendationsListPanelContent tab={tab} />
  }
  if (tab.type === 'subjectReviews') return <SubjectReviewsListPanelContent tab={tab} />
  if (tab.type === 'searchSubjects') return <SearchSubjectsListPanelContent tab={tab} />
  if (tab.type === 'searchMonos') return <SearchMonosListPanelContent tab={tab} />

  return <MonoListPanelContentGroupTwo tab={tab} />
}

function MonoListPanelContentGroupTwo({ tab }: { tab: MonoListPanelTab }) {
  if (tab.type === 'communityTopics') return <CommunityTopicsListPanelContent tab={tab} />
  if (tab.type === 'communityGroupTopics') return <CommunityGroupTopicsListPanelContent tab={tab} />
  if (tab.type === 'communitySubjectTopics') {
    return <CommunitySubjectTopicsListPanelContent tab={tab} />
  }
  if (tab.type === 'communityGroups') return <CommunityGroupsListPanelContent tab={tab} />
  if (tab.type === 'siteTimeline') return <SiteTimelineListPanelContent tab={tab} />
  if (tab.type === 'trendingSubjects') return <TrendingSubjectsListPanelContent tab={tab} />
  if (tab.type === 'userFriends') return <UserFriendsListPanelContent tab={tab} />
  if (tab.type === 'userCollections') return <UserCollectionsListPanelContent tab={tab} />
  return null
}
