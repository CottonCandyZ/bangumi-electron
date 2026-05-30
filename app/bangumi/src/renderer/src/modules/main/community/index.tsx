import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import {
  useGroupsQuery,
  useRecentGroupTopicsQuery,
  useRecentSubjectTopicsQuery,
  useTrendingSubjectTopicsQuery,
  useUserGroupsQuery,
} from '@renderer/data/hooks/api/community'
import { useSession } from '@renderer/data/hooks/session'
import { MainBackToTopButton } from '@renderer/modules/main/back-to-top-button'

import { GroupsSection } from './groups-section'
import { CommunityTopicSection } from './topic-preview-section'

export function Community() {
  const session = useSession()
  const groupTopicsQuery = useRecentGroupTopicsQuery({ mode: 'all', limit: 24 })
  const joinedGroupTopicsQuery = useRecentGroupTopicsQuery({ mode: 'joined', limit: 24 })
  const subjectTopicsQuery = useRecentSubjectTopicsQuery({ limit: 24 })
  const trendingTopicsQuery = useTrendingSubjectTopicsQuery({ limit: 24 })
  const popularGroupsQuery = useGroupsQuery({ sort: 'members', limit: 15 })
  const joinedGroupsQuery = useUserGroupsQuery({
    username: session?.username,
    limit: 18,
    enabled: !!session?.username,
  })

  usePageScrollRestoreReady(
    !groupTopicsQuery.isLoading &&
      !joinedGroupTopicsQuery.isLoading &&
      !subjectTopicsQuery.isLoading &&
      !trendingTopicsQuery.isLoading &&
      !popularGroupsQuery.isLoading &&
      (!session?.username || !joinedGroupsQuery.isLoading),
  )

  return (
    <div className="min-h-full">
      <div className="flex w-full flex-col gap-8 px-8 py-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-normal">讨论</h1>
        </header>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-4">
          <CommunityTopicSection
            section={{
              description: '你加入的小组里的近期讨论',
              groupMode: 'joined',
              id: 'community-joined-groups',
              panelTitle: '我的小组',
              title: '我的小组',
              topicKind: 'group',
            }}
            query={joinedGroupTopicsQuery}
          />
          <CommunityTopicSection
            section={{
              description: '按近期热度排序的条目话题',
              id: 'community-trending',
              panelTitle: '热门',
              title: '热门条目讨论',
              topicKind: 'trending-subject',
            }}
            query={trendingTopicsQuery}
          />
          <CommunityTopicSection
            section={{
              description: '按最近回复排序的条目话题',
              id: 'community-subjects',
              panelTitle: '条目',
              title: '最新条目讨论',
              topicKind: 'subject',
            }}
            query={subjectTopicsQuery}
          />
          <CommunityTopicSection
            section={{
              description: '全站小组正在更新的话题',
              groupMode: 'all',
              id: 'community-groups',
              panelTitle: '小组',
              title: '小组讨论',
              topicKind: 'group',
            }}
            query={groupTopicsQuery}
          />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <GroupsSection
            emptyText="还没有加入小组。"
            loginText="后显示关注的小组。"
            groups={joinedGroupsQuery.data?.pages.flatMap((page) => page.data) ?? []}
            listKind="user"
            loading={!!session?.username && joinedGroupsQuery.isLoading}
            panelTitle="关注小组"
            signedIn={!!session?.username}
            sourceTitle="讨论"
            sourceTo="/talk"
            title="关注的小组"
            username={session?.username}
          />
          <GroupsSection
            emptyText="暂无小组"
            groups={popularGroupsQuery.data?.pages.flatMap((page) => page.data) ?? []}
            listKind="all"
            loading={popularGroupsQuery.isLoading}
            panelTitle="热门小组"
            previewLimit={15}
            signedIn
            sort="members"
            sourceTitle="讨论"
            sourceTo="/talk"
            title="热门小组"
          />
        </div>
      </div>
      <MainBackToTopButton />
    </div>
  )
}
