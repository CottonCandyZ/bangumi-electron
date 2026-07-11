import { MyLink } from '@renderer/components/my-link'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useUserBlogsQuery } from '@renderer/data/hooks/api/blog'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import dayjs from 'dayjs'

export function UserBlogList({ username }: { username: string }) {
  const query = useUserBlogsQuery({ enabled: !!username, username })
  const entries = query.data?.pages.flatMap((page) => page.data)

  if (query.isError) return <p className="text-muted-foreground text-sm">暂时无法读取日志。</p>
  if (!entries) return <BlogListSkeleton />
  if (entries.length === 0) return <p className="text-muted-foreground text-sm">还没有公开日志。</p>

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <MyLink key={entry.id} to={`/blog/${entry.id}`}>
          <Card className="hover:bg-accent/60 flex flex-col gap-2 p-4 shadow-none transition-colors">
            <div className="flex items-start justify-between gap-4">
              <h2 className="line-clamp-2 text-lg font-semibold">{entry.title}</h2>
              <span className="text-muted-foreground shrink-0 text-xs">
                {entry.replies > 0 ? `${entry.replies} 回复` : '暂无回复'}
              </span>
            </div>
            {entry.summary && (
              <div className="bbcode text-muted-foreground line-clamp-3 text-sm leading-6">
                {renderBBCode(entry.summary)}
              </div>
            )}
            <time
              className="text-muted-foreground text-xs"
              dateTime={dayjs.unix(entry.createdAt).toISOString()}
            >
              {formatRecentUnixTime(entry.createdAt)}
            </time>
          </Card>
        </MyLink>
      ))}
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
    </div>
  )
}

function BlogListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="flex flex-col gap-3 rounded-lg border p-4" key={index}>
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}
