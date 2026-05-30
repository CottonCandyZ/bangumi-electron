import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Skeleton } from '@renderer/components/ui/skeleton'
import type { GroupMember } from '@renderer/data/types/community'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import { QueryRefreshButton } from '@renderer/modules/common/query-refresh-button'

export function GroupMembersPreview({
  error,
  loading,
  members,
  onRefresh,
  refreshing,
}: {
  error: boolean
  loading: boolean
  members: GroupMember[]
  onRefresh: () => Promise<unknown> | unknown
  refreshing: boolean
}) {
  return (
    <aside className="hidden min-h-0 w-64 shrink-0 flex-col lg:flex">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <h2 className="text-xl font-medium">近期加入</h2>
        <QueryRefreshButton onRefresh={onRefresh} refreshing={refreshing} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {error ? (
          <p className="text-muted-foreground text-sm">暂时无法读取成员。</p>
        ) : loading && members.length === 0 ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <GroupMemberSkeleton key={index} />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="text-muted-foreground text-sm">暂无成员。</p>
        ) : (
          <div className="flex flex-col gap-1">
            {members.map((member) => (
              <GroupMemberItem key={member.uid} member={member} />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

function GroupMemberItem({ member }: { member: GroupMember }) {
  const user = member.user

  if (!user) {
    return (
      <div className="flex min-w-0 items-center gap-2 rounded-md p-2">
        <div className="bg-muted size-8 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="line-clamp-1 text-sm font-medium">#{member.uid}</div>
          <div className="text-muted-foreground mt-0.5 text-xs">
            {formatRecentUnixTime(member.joinedAt)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <MyLink
      className="hover:bg-accent flex min-w-0 items-center gap-2 rounded-md p-2 transition-colors"
      to={`/user/${encodeURIComponent(user.username)}`}
    >
      {user.avatar?.medium ? (
        <Image
          className="size-8 shrink-0 overflow-hidden rounded-full"
          imageClassName="h-full w-full object-cover"
          imageSrc={user.avatar.medium}
        />
      ) : (
        <div className="bg-muted size-8 shrink-0 rounded-full" />
      )}
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-sm font-medium">{user.nickname || user.username}</div>
        <div className="text-muted-foreground mt-0.5 text-xs">
          {formatRecentUnixTime(member.joinedAt)}
        </div>
      </div>
    </MyLink>
  )
}

function GroupMemberSkeleton() {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md p-2">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}
