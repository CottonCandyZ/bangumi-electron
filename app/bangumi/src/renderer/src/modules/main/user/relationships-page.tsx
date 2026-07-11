import { Image } from '@renderer/components/image/image'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { UserHoverCardLink } from '@renderer/components/user-hover-card'
import { useUserFollowersQuery } from '@renderer/data/hooks/api/relationship'

export function UserFollowersPage({ username }: { username: string | undefined }) {
  const query = useUserFollowersQuery({ enabled: !!username, username })
  const users = query.data?.pages.flatMap((page) => page.data)
  const title = '粉丝'

  if (!username) return <p className="text-muted-foreground p-10 text-sm">缺少用户名。</p>

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-10 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">@{username}</p>
        </div>
      </header>
      {query.isError ? (
        <p className="text-muted-foreground text-sm">暂时无法读取{title}列表。</p>
      ) : !users ? (
        <RelationshipSkeleton />
      ) : users.length === 0 ? (
        <p className="text-muted-foreground text-sm">这里还没有用户。</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <UserHoverCardLink
              key={user.id}
              to={`/user/${encodeURIComponent(user.username)}`}
              user={user}
            >
              <Card className="hover:bg-accent flex items-center gap-3 p-3 shadow-none transition-colors">
                <Image
                  className="size-12 shrink-0 overflow-hidden rounded-full"
                  imageClassName="h-full w-full object-cover"
                  imageSrc={user.avatar.medium}
                />
                <div className="min-w-0">
                  <h2 className="truncate font-medium">{user.nickname || user.username}</h2>
                  <p className="text-muted-foreground truncate text-xs">@{user.username}</p>
                </div>
              </Card>
            </UserHoverCardLink>
          ))}
        </div>
      )}
      {query.hasNextPage && (
        <Button
          className="self-center"
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
          variant="outline"
        >
          {query.isFetchingNextPage ? '加载中…' : '加载更多'}
        </Button>
      )}
    </main>
  )
}

function RelationshipSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }, (_, index) => (
        <Skeleton className="h-20" key={index} />
      ))}
    </div>
  )
}
