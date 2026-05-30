import { Image } from '@renderer/components/image/image'
import { Skeleton } from '@renderer/components/ui/skeleton'
import type { Group } from '@renderer/data/types/community'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import dayjs from 'dayjs'

export function GroupHeader({
  group,
  loading,
}: {
  group: Group | null | undefined
  loading: boolean
}) {
  if (loading || !group) {
    return (
      <section className="flex min-w-0 gap-4">
        <Skeleton className="size-20 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-20 w-full" />
        </div>
      </section>
    )
  }

  return (
    <section className="flex min-w-0 flex-col gap-4 lg:flex-row">
      {group.icon?.large || group.icon?.medium ? (
        <Image
          className="size-20 shrink-0 overflow-hidden rounded-xl border"
          imageSrc={group.icon.large || group.icon.medium}
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex size-20 shrink-0 items-center justify-center rounded-xl border">
          <span className="i-mingcute-group-3-line text-3xl" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="line-clamp-2 text-2xl font-semibold">{group.title || group.name}</h1>
            <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <span>{group.name}</span>
              <span>{group.members} 成员</span>
              <span>{group.topics} 话题</span>
              <span>{dayjs.unix(group.createdAt).format('YYYY-MM-DD')}</span>
            </div>
          </div>
        </div>
        {group.description && (
          <div className="bbcode text-muted-foreground mt-3 max-h-28 max-w-4xl overflow-x-hidden overflow-y-auto pr-2 text-sm leading-6 whitespace-pre-line">
            {renderBBCode(group.description)}
          </div>
        )}
      </div>
    </section>
  )
}
