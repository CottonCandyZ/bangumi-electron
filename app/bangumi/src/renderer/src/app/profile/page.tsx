import { ViewTransitionImage } from '@renderer/components/image/view-transition-image'
import { MyLink } from '@renderer/components/my-link'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useInfinityQueryCollectionsByUsername } from '@renderer/data/hooks/api/collection'
import {
  useUserInfoByUsernameQuery,
  useUserProfileQuery,
  useUserTimelineQuery,
} from '@renderer/data/hooks/api/user'
import { useSession } from '@renderer/data/hooks/session'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { UserInfo, UserProfile, UserTimelineItem } from '@renderer/data/types/user'
import { useStateHook } from '@renderer/hooks/use-cache-state'
import { cn } from '@renderer/lib/utils'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { sidePanelCollectionTypeFilterAtom } from '@renderer/state/collection'
import { scrollCache } from '@renderer/state/global-var'
import { userProfileAvatarInViewAtom } from '@renderer/state/in-view'
import {
  nvaCollectionButtonAtomAction,
  openMonoListPanelTabAtomAction,
  rightPanelOpenAtom,
} from '@renderer/state/panel'
import {
  hasUserTimelineItemDetails,
  UserTimelineItemCard,
  UserTimelineSkeleton,
} from '@renderer/modules/common/user/timeline'
import { useSetAtom } from 'jotai'
import { Activity, CalendarDays, UserRound } from 'lucide-react'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useLocation, useParams, useViewTransitionState } from 'react-router-dom'

const COLLECTION_PREVIEW_LIMIT = 10
const PROFILE_SUBJECT_SECTIONS = [
  { name: '动画', type: SubjectType.anime },
  { name: '游戏', type: SubjectType.game },
  { name: '书籍', type: SubjectType.book },
  { name: '音乐', type: SubjectType.music },
  { name: '三次元', type: SubjectType.real },
] as const

const PREVIEW_COLLECTION_TYPES = [CollectionType.watching, CollectionType.watched] as const
const COLLECTION_FILTER_TYPES = [
  CollectionType.watching,
  CollectionType.watched,
  CollectionType.wantToWatch,
  CollectionType.aside,
  CollectionType.abandoned,
] as const

export function Component() {
  const session = useSession()
  const params = useParams()
  const routeUsername = params.username
  const username = routeUsername ?? session?.username
  const canUseSessionFallback = !!session && (!routeUsername || routeUsername === session.username)
  const isOwnProfile = !!username && username === session?.username
  const openLoginDialog = useSetAtom(loginDialogAtom)
  const profileQuery = useUserProfileQuery({ username, enabled: !!username })
  const userInfoQuery = useUserInfoByUsernameQuery({ username, enabled: !!username })
  const timelineQuery = useUserTimelineQuery({ username, limit: 4, enabled: !!username })
  const { init: cachedAvatarInView } = useStateHook<boolean>({ key: 'userProfileAvatarInView' })
  const setAvatarInView = useSetAtom(userProfileAvatarInViewAtom)
  const pathname = routeUsername ? `/user/${encodeURIComponent(routeUsername)}` : '/profile'
  const user = profileQuery.data ?? userInfoQuery.data ?? (canUseSessionFallback ? session : null)
  const userMissing = !user && !profileQuery.isPending && !userInfoQuery.isPending
  const avatarViewTransitionName = useProfileAvatarViewTransitionName(pathname)
  const collectionSections = PROFILE_SUBJECT_SECTIONS.filter(
    (section) => sumSubjectStats(profileQuery.data?.stats.subject[section.type]) > 0,
  )
  const setRightPanelOpen = useSetAtom(rightPanelOpenAtom)

  useEffect(() => {
    setAvatarInView(
      cachedAvatarInView !== undefined ? cachedAvatarInView : (scrollCache.get(pathname) ?? 0) <= 0,
    )
  }, [cachedAvatarInView, pathname, setAvatarInView, username])

  if (!username) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
            <UserRound className="size-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">个人页面</h1>
            <p className="text-muted-foreground text-sm">登录后查看个人信息、留言和收藏预览。</p>
          </div>
          <Button onClick={() => openLoginDialog({ open: true })}>登录</Button>
        </div>
      </div>
    )
  }

  if (userMissing) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
            <UserRound className="size-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">无法显示用户</h1>
            <p className="text-muted-foreground text-sm">
              {profileQuery.isError || userInfoQuery.isError
                ? '暂时无法读取这个用户的信息。'
                : '没有找到这个用户。'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 px-9 pt-6 pb-20">
      <ProfileHeader
        avatarViewTransitionName={avatarViewTransitionName}
        loading={profileQuery.isPending && userInfoQuery.isPending}
        onAvatarInViewChange={setAvatarInView}
        profile={profileQuery.data}
        user={user}
        username={username}
      />

      <TimelinePreview
        error={timelineQuery.isError}
        items={timelineQuery.data}
        loading={timelineQuery.isPending}
        onOpenAll={() => setRightPanelOpen(true)}
      />

      {collectionSections.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-row items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-medium">收藏</h2>
            </div>
          </div>
          <div className="flex flex-col gap-8">
            {collectionSections.map((section) => (
              <CollectionPreviewSection
                key={section.type}
                subjectType={section.type}
                title={section.name}
                username={username}
                userTitle={user?.nickname || username}
                stats={profileQuery.data?.stats.subject[section.type]}
                ownProfile={isOwnProfile}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ProfileHeader({
  avatarViewTransitionName,
  loading,
  onAvatarInViewChange,
  profile,
  user,
  username,
}: {
  avatarViewTransitionName?: string
  loading: boolean
  onAvatarInViewChange: (inView: boolean) => void
  profile: UserProfile | null | undefined
  user: UserInfo | UserProfile | null | undefined
  username: string
}) {
  if (loading || !user) {
    return (
      <section className="flex flex-row gap-5">
        <Skeleton className="size-24 shrink-0 rounded-2xl" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-20 w-full" />
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <ViewTransitionImage
        active={!!avatarViewTransitionName}
        cacheKey="userProfileAvatarInView"
        key={`user-${username}-avatar`}
        className="size-24 shrink-0 overflow-hidden rounded-2xl border shadow-xs"
        imageSrc={user.avatar.large || user.avatar.medium}
        onInViewChange={onAvatarInViewChange}
        viewTransitionName={avatarViewTransitionName}
      />
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-semibold">{user.nickname}</h1>
            <div className="text-muted-foreground mt-1 flex flex-row flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span>@{user.username}</span>
              {'joinedAt' in user && typeof user.joinedAt === 'number' && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  {dayjs.unix(user.joinedAt).format('YYYY-MM-DD')}
                </span>
              )}
              {profile?.location && <span>{profile.location}</span>}
            </div>
          </div>
        </div>

        {user.sign && (
          <div className="bbcode text-muted-foreground text-sm whitespace-pre-line">
            {renderBBCode(user.sign)}
          </div>
        )}

        {profile?.bio && (
          <div className="bbcode bg-muted/25 max-h-48 overflow-x-hidden overflow-y-auto rounded-md border p-3 text-sm leading-6 whitespace-pre-line">
            {renderBBCode(profile.bio)}
          </div>
        )}

        {profile && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            <Stat label="好友" value={profile.stats.friend} />
            <Stat label="小组" value={profile.stats.group} />
            <Stat label="日志" value={profile.stats.blog} />
            <Stat label="目录" value={profile.stats.index.create + profile.stats.index.collect} />
            <Stat label="人物" value={profile.stats.mono.person} />
            <Stat label="角色" value={profile.stats.mono.character} />
          </div>
        )}
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  )
}

function TimelinePreview({
  error,
  items,
  loading,
  onOpenAll,
}: {
  error: boolean
  items: UserTimelineItem[] | undefined
  loading: boolean
  onOpenAll: () => void
}) {
  const visibleItems = items?.filter(hasUserTimelineItemDetails)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-row items-center gap-2">
          <Activity className="text-muted-foreground size-5" />
          <h2 className="text-2xl font-medium">时间线</h2>
        </div>
        {visibleItems && visibleItems.length > 0 && (
          <Button className="h-8 px-2 text-xs" onClick={onOpenAll} size="sm" variant="ghost">
            全部
          </Button>
        )}
      </div>
      {error ? (
        <p className="text-muted-foreground text-sm">暂时无法读取时间线。</p>
      ) : loading || !visibleItems ? (
        <UserTimelineSkeleton className="grid gap-3 md:grid-cols-2" count={4} />
      ) : visibleItems.length === 0 ? (
        <p className="text-muted-foreground text-sm">近期没有动态。</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visibleItems.map((item) => (
            <UserTimelineItemCard item={item} key={item.id} />
          ))}
        </div>
      )}
    </section>
  )
}

function CollectionPreviewSection({
  ownProfile,
  stats,
  subjectType,
  title,
  userTitle,
  username,
}: {
  ownProfile: boolean
  stats?: Partial<Record<CollectionType, number>>
  subjectType: SubjectType
  title: string
  userTitle: string
  username: string
}) {
  const openCollectionPanel = useOpenCollectionPanel({
    ownProfile,
    subjectType,
    userTitle,
    username,
  })
  const collectionFilters = COLLECTION_FILTER_TYPES.map((collectionType) => ({
    collectionType,
    count: stats?.[collectionType] ?? 0,
  })).filter((item) => item.count > 0)
  const previewCollectionTypes = PREVIEW_COLLECTION_TYPES.filter((collectionType) =>
    hasCollectionStats(stats, collectionType),
  )

  if (sumSubjectStats(stats) === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-row items-baseline gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <span className="text-muted-foreground text-sm tabular-nums">
              {sumSubjectStats(stats)}
            </span>
          </div>
          {collectionFilters.length > 0 && (
            <div className="flex flex-row flex-wrap gap-1.5">
              {collectionFilters.map(({ collectionType, count }) => (
                <Button
                  className="border-border/80 h-7 gap-1.5 rounded-full px-2.5 text-xs font-normal shadow-none"
                  key={collectionType}
                  onClick={() => openCollectionPanel(collectionType)}
                  size="sm"
                  variant="outline"
                >
                  {COLLECTION_TYPE_MAP(subjectType)[collectionType]}
                  <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[0.65rem] leading-none tabular-nums">
                    {count}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {previewCollectionTypes.map((collectionType) => (
          <CollectionPreviewRow
            collectionType={collectionType}
            key={collectionType}
            subjectType={subjectType}
            username={username}
          />
        ))}
      </div>
    </section>
  )
}

function CollectionPreviewRow({
  collectionType,
  subjectType,
  username,
}: {
  collectionType: CollectionType
  subjectType: SubjectType
  username: string
}) {
  const collectionsQuery = useInfinityQueryCollectionsByUsername({
    username,
    subjectType,
    collectionType,
    limit: COLLECTION_PREVIEW_LIMIT,
    initialPageParam: 0,
    enabled: !!username,
    needKeepPreviousData: false,
  })
  const collections = collectionsQuery.data?.pages[0]?.data

  if (collectionsQuery.isError) return null
  if (!collections) return <CollectionSkeletonGrid subjectType={subjectType} />
  if (collections.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-muted-foreground text-sm font-medium">
        {COLLECTION_TYPE_MAP(subjectType)[collectionType]}
      </h4>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
        {collections.map((collection) => (
          <CollectionPreviewItem collection={collection} key={collection.subject_id} />
        ))}
      </div>
    </div>
  )
}

function useOpenCollectionPanel({
  ownProfile,
  subjectType,
  userTitle,
  username,
}: {
  ownProfile: boolean
  subjectType: SubjectType
  userTitle: string
  username: string
}) {
  const openCollectionPanel = useSetAtom(nvaCollectionButtonAtomAction)
  const setCollectionTypeFilter = useSetAtom(sidePanelCollectionTypeFilterAtom)
  const openMonoListPanelTab = useSetAtom(openMonoListPanelTabAtomAction)

  return (collectionType: CollectionType) => {
    if (ownProfile) {
      setCollectionTypeFilter(subjectType.toString(), collectionType)
      openCollectionPanel(SubjectType[subjectType] as keyof typeof SubjectType, true, undefined)
      return
    }

    openMonoListPanelTab({
      id: `user-${username}-${subjectType}-${collectionType}`,
      type: 'userCollections',
      title: `${COLLECTION_TYPE_MAP(subjectType)[collectionType]} · ${SUBJECT_TYPE_MAP[subjectType]}`,
      sourceTitle: userTitle,
      username,
      subjectType,
      collectionType,
    })
  }
}

function CollectionPreviewItem({ collection }: { collection: CollectionData }) {
  const subject = collection.subject
  const { key } = useLocation()
  const to = `/subject/${collection.subject_id}`
  const isTransitioning = useViewTransitionState(to)
  const viewTransitionName = `cover-image-${collection.subject_id}-${key}`

  return (
    <MyLink
      className="group min-w-0 cursor-default"
      state={{ viewTransitionName }}
      to={to}
      viewTransition
    >
      <Card className="group-hover:bg-accent h-full rounded-md border shadow-none group-hover:duration-300">
        <CardContent className="flex h-full flex-col gap-2 p-2">
          <div className="relative overflow-hidden rounded border shadow-xs">
            <ViewTransitionImage
              active={isTransitioning}
              className={cn(
                'w-full overflow-hidden',
                subject.type === SubjectType.music ? 'aspect-square' : 'aspect-[5/7]',
              )}
              imageSrc={subject.images.medium || subject.images.grid}
              viewTransitionName={viewTransitionName}
            />
            {collection.rate > 0 && (
              <div className="absolute right-0 bottom-0 left-0 z-10 flex h-12 items-end bg-linear-to-t from-black/55 px-2 py-1.5">
                <div className="flex items-center gap-1 text-lg font-bold text-white tabular-nums">
                  {collection.rate}
                  <span className="i-mingcute-star-fill mt-0.5 text-sm" />
                </div>
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <h4 className="line-clamp-2 text-sm font-medium">{subject.name_cn || subject.name}</h4>
            {subject.name_cn && (
              <p className="font-jp text-muted-foreground line-clamp-1 text-xs">{subject.name}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </MyLink>
  )
}

function useProfileAvatarViewTransitionName(to: string) {
  const { state } = useLocation() as { state?: { viewTransitionName?: string } }
  const isTransitioning = useViewTransitionState(to)

  return isTransitioning && state?.viewTransitionName ? state.viewTransitionName : undefined
}

const SUBJECT_TYPE_MAP = {
  [SubjectType.anime]: '动画',
  [SubjectType.book]: '书籍',
  [SubjectType.game]: '游戏',
  [SubjectType.music]: '音乐',
  [SubjectType.real]: '三次元',
} as const

function sumSubjectStats(stats?: Partial<Record<CollectionType, number>>) {
  if (!stats) return 0
  return Object.values(stats).reduce((sum, value) => sum + (value ?? 0), 0)
}

function hasCollectionStats(
  stats: Partial<Record<CollectionType, number>> | undefined,
  collectionType: CollectionType,
) {
  return (stats?.[collectionType] ?? 0) > 0
}

function CollectionSkeletonGrid({ subjectType }: { subjectType: SubjectType }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
      {Array(COLLECTION_PREVIEW_LIMIT)
        .fill(0)
        .map((_, index) => (
          <div className="flex flex-col gap-2" key={index}>
            <Skeleton
              className={cn(
                'w-full rounded-md',
                subjectType === SubjectType.music ? 'aspect-square' : 'aspect-[5/7]',
              )}
            />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        ))}
    </div>
  )
}
