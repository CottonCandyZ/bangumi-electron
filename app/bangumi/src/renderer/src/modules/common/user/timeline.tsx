import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Card } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SubjectType } from '@renderer/data/types/subject'
import {
  UserTimelineEpisode,
  UserTimelineItem,
  UserTimelineSlimGroup,
  UserTimelineSlimMono,
  UserTimelineSlimSubject,
  UserTimelineSlimUser,
} from '@renderer/data/types/user'
import { cn } from '@renderer/lib/utils'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'

export function UserTimelineItemCard({
  className,
  compact = false,
  expanded = false,
  item,
  surface = 'card',
}: {
  className?: string
  compact?: boolean
  expanded?: boolean
  item: UserTimelineItem
  surface?: 'card' | 'plain'
}) {
  const statusText = (item.memo.status?.tsukkomi ?? item.memo.status?.sign)?.trim()
  const nicknameChange = item.memo.status?.nickname
  const subjects = item.memo.subject ?? []
  const progress = item.memo.progress
  const batchProgressMeta = progress?.batch ? formatBatchProgressMeta(progress.batch) : undefined
  const hasDetails = hasUserTimelineItemDetails(item)

  if (!hasDetails) return null
  const Container = surface === 'card' ? Card : 'div'

  return (
    <Container
      className={cn(
        'flex flex-col gap-3',
        surface === 'card' ? 'p-3 shadow-none' : 'border-border/70 border-b py-3',
        compact && 'gap-2',
        className,
      )}
    >
      {statusText && (
        <div className="bbcode text-sm leading-6 whitespace-pre-line">
          {renderBBCode(statusText)}
        </div>
      )}

      {nicknameChange && (
        <div className="text-muted-foreground text-sm">
          昵称由 <span className="text-foreground">{nicknameChange.before}</span> 改为{' '}
          <span className="text-foreground">{nicknameChange.after}</span>
        </div>
      )}

      {subjects.length > 0 && (
        <div className="flex flex-col gap-2">
          {subjects.map((subjectItem) => (
            <TimelineSubject
              comment={subjectItem.comment}
              key={`${item.id}-${subjectItem.subject.id}-${subjectItem.collectID ?? ''}`}
              rate={subjectItem.rate}
              subject={subjectItem.subject}
              compact={compact}
              expanded={expanded}
            />
          ))}
        </div>
      )}

      {progress?.batch && (
        <TimelineSubject
          subject={progress.batch.subject}
          meta={batchProgressMeta}
          compact={compact}
          expanded={expanded}
        />
      )}

      {progress?.single && (
        <TimelineEpisodeProgress
          episode={progress.single.episode}
          subject={progress.single.subject}
          compact={compact}
          expanded={expanded}
        />
      )}

      {item.memo.wiki?.subject && (
        <TimelineSubject
          subject={item.memo.wiki.subject}
          meta="维基编辑"
          compact={compact}
          expanded={expanded}
        />
      )}

      {item.memo.blog && (
        <TimelineText
          title={item.memo.blog.title}
          description={item.memo.blog.summary}
          meta={item.memo.blog.replies > 0 ? `${item.memo.blog.replies} 回复` : undefined}
          expanded={expanded}
        />
      )}

      {item.memo.index && (
        <TimelineText
          title={item.memo.index.title}
          meta={`${item.memo.index.total} 个项目`}
          expanded={expanded}
        />
      )}

      {item.memo.mono && (
        <div className="flex flex-col gap-2">
          {item.memo.mono.characters.map((character) => (
            <TimelineMono item={character} key={`character-${character.id}`} type="character" />
          ))}
          {item.memo.mono.persons.map((person) => (
            <TimelineMono item={person} key={`person-${person.id}`} type="person" />
          ))}
        </div>
      )}

      {item.memo.daily?.users && item.memo.daily.users.length > 0 && (
        <TimelineUsers users={item.memo.daily.users} />
      )}

      {item.memo.daily?.groups && item.memo.daily.groups.length > 0 && (
        <TimelineGroups groups={item.memo.daily.groups} />
      )}

      <TimelineItemMeta item={item} />
    </Container>
  )
}

export function hasUserTimelineItemDetails(item: UserTimelineItem) {
  const statusText = (item.memo.status?.tsukkomi ?? item.memo.status?.sign)?.trim()
  return (
    !!statusText ||
    !!item.memo.status?.nickname ||
    !!item.memo.daily?.users?.length ||
    !!item.memo.daily?.groups?.length ||
    !!item.memo.wiki?.subject ||
    (item.memo.subject?.length ?? 0) > 0 ||
    !!item.memo.progress?.batch ||
    !!item.memo.progress?.single ||
    !!item.memo.blog ||
    !!item.memo.index ||
    !!item.memo.mono?.characters.length ||
    !!item.memo.mono?.persons.length
  )
}

function formatBatchProgressMeta(
  progress: NonNullable<UserTimelineItem['memo']['progress']>['batch'],
) {
  if (!progress) return undefined

  const parts = [
    formatProgressPart(progress.epsUpdate, progress.epsTotal, '话'),
    formatProgressPart(progress.volsUpdate, progress.volsTotal, '卷'),
  ].filter((part): part is string => part !== undefined)

  return parts.length > 0 ? `完成了 ${parts.join(' / ')}` : undefined
}

function formatProgressPart(update: number | undefined, total: string | undefined, unit: string) {
  if (update === undefined || update <= 0) return undefined
  return `${update} of ${total || '??'} ${unit}`
}

function TimelineItemMeta({ item }: { item: UserTimelineItem }) {
  return (
    <div className="text-muted-foreground mt-0.5 flex flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
      {item.replies > 0 && <span className="tabular-nums">{item.replies} 回复</span>}
      {item.replies > 0 && <span>·</span>}
      <time
        dateTime={dayjs.unix(item.createdAt).toISOString()}
        title={dayjs.unix(item.createdAt).format('YYYY-MM-DD HH:mm')}
      >
        {formatRecentUnixTime(item.createdAt)}
      </time>
      {item.source.name && (
        <>
          <span>·</span>
          {item.source.url ? (
            <a
              className="hover:text-primary underline-offset-2 hover:underline"
              href={item.source.url}
              rel="noreferrer"
              target="_blank"
            >
              {item.source.name}
            </a>
          ) : (
            <span>{item.source.name}</span>
          )}
        </>
      )}
    </div>
  )
}

function TimelineEpisodeProgress({
  compact,
  episode,
  expanded,
  subject,
}: {
  compact: boolean
  episode: UserTimelineEpisode
  expanded: boolean
  subject: UserTimelineSlimSubject
}) {
  const episodeTitle = episode.nameCN || episode.name
  const episodeLabel = `ep.${episode.sort}`

  return (
    <TimelineSubject
      subject={subject}
      compact={compact}
      expanded={expanded}
      description={
        <MyLink
          className="text-muted-foreground hover:text-primary mt-1 flex min-w-0 flex-row items-baseline gap-1 text-xs transition-colors"
          to={`/episode/${episode.id}`}
        >
          <span className="shrink-0 tabular-nums">{episodeLabel}</span>
          {episodeTitle && (
            <span className={cn('min-w-0', !expanded && 'line-clamp-1')}>{episodeTitle}</span>
          )}
        </MyLink>
      }
    />
  )
}

function TimelineSubject({
  comment,
  compact,
  description,
  expanded,
  meta,
  rate,
  subject,
}: {
  comment?: string
  compact: boolean
  description?: ReactNode
  expanded: boolean
  meta?: string
  rate?: number
  subject: UserTimelineSlimSubject
}) {
  return (
    <div className="flex min-w-0 flex-row items-start gap-2">
      <div className="flex shrink-0 flex-col items-center gap-1">
        {subject.images?.grid || subject.images?.small ? (
          <MyLink to={`/subject/${subject.id}`}>
            <Image
              className={cn(
                'overflow-hidden rounded border',
                compact ? 'size-10' : 'h-14 w-10',
                subject.type === SubjectType.music && 'aspect-square h-12 w-12',
              )}
              imageSrc={subject.images.grid || subject.images.small}
            />
          </MyLink>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <MyLink
          className={cn(
            'hover:text-primary text-sm font-medium transition-colors',
            !expanded && 'line-clamp-1',
          )}
          to={`/subject/${subject.id}`}
        >
          {subject.nameCN || subject.name}
        </MyLink>
        {subject.nameCN && (
          <div className={cn('font-jp text-muted-foreground text-xs', !expanded && 'line-clamp-1')}>
            {subject.name}
          </div>
        )}
        {meta && (
          <div className="text-muted-foreground mt-1 flex flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs tabular-nums">
            <span>{meta}</span>
          </div>
        )}
        {!comment && rate ? <TimelineRate rate={rate} className="mt-1" /> : null}
        {comment && (
          <div
            className={cn(
              'bbcode bg-muted/35 border-border/60 mt-2 rounded-md border px-2.5 py-2 text-sm leading-6 whitespace-pre-line',
              !expanded && 'line-clamp-3',
            )}
          >
            {rate ? <TimelineRate rate={rate} className="mr-2 align-[0.05em]" /> : null}
            {renderBBCode(comment)}
          </div>
        )}
        {description}
      </div>
    </div>
  )
}

function TimelineRate({ className, rate }: { className?: string; rate: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-sm leading-none font-medium tabular-nums',
        className,
      )}
      style={{ color: `hsl(var(--chart-score-${rate}))` }}
    >
      {rate}
      <span className="i-mingcute-star-fill text-xs" />
    </span>
  )
}

function TimelineText({
  description,
  expanded,
  meta,
  title,
}: {
  description?: string
  expanded: boolean
  meta?: string
  title: string
}) {
  return (
    <div className="min-w-0">
      <div className={cn('text-sm font-medium', !expanded && 'line-clamp-2')}>{title}</div>
      {meta && <div className="text-muted-foreground mt-1 text-xs">{meta}</div>}
      {description && (
        <div
          className={cn(
            'bbcode text-muted-foreground mt-1 text-sm leading-6',
            !expanded && 'line-clamp-3',
          )}
        >
          {renderBBCode(description)}
        </div>
      )}
    </div>
  )
}

function TimelineMono({
  item,
  type,
}: {
  item: UserTimelineSlimMono
  type: 'character' | 'person'
}) {
  return (
    <div className="flex min-w-0 flex-row gap-2">
      {item.images?.grid || item.images?.small ? (
        <MyLink className="shrink-0" to={`/${type}/${item.id}`}>
          <Image
            className="size-10 overflow-hidden rounded border"
            imageSrc={item.images.grid || item.images.small}
          />
        </MyLink>
      ) : null}
      <div className="min-w-0 flex-1">
        <MyLink
          className="hover:text-primary line-clamp-1 text-sm font-medium transition-colors"
          to={`/${type}/${item.id}`}
        >
          {item.nameCN || item.name}
        </MyLink>
        {item.nameCN && (
          <div className="font-jp text-muted-foreground line-clamp-1 text-xs">{item.name}</div>
        )}
      </div>
    </div>
  )
}

function TimelineUsers({ users }: { users: UserTimelineSlimUser[] }) {
  return (
    <div className="flex flex-col gap-2">
      {users.map((user) => (
        <MyLink
          className="hover:bg-accent flex min-w-0 flex-row items-center gap-2 rounded-md p-1.5 transition-colors"
          key={user.id}
          to={`/user/${encodeURIComponent(user.username)}`}
        >
          {user.avatar?.medium ? (
            <Image
              className="size-9 shrink-0 overflow-hidden rounded-full"
              imageClassName="h-full w-full object-cover"
              imageSrc={user.avatar.medium}
            />
          ) : (
            <div className="bg-muted size-9 shrink-0 rounded-full" />
          )}
          <div className="min-w-0 flex-1">
            <div className="line-clamp-1 text-sm font-medium">{user.nickname || user.username}</div>
            <div className="text-muted-foreground line-clamp-1 text-xs">@{user.username}</div>
          </div>
          <span className="text-muted-foreground shrink-0 text-xs">添加为好友</span>
        </MyLink>
      ))}
    </div>
  )
}

function TimelineGroups({ groups }: { groups: UserTimelineSlimGroup[] }) {
  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => (
        // TODO: Link to the group page once group routing is supported.
        <div
          className="hover:bg-accent flex min-w-0 flex-row items-center gap-2 rounded-md p-1.5 transition-colors"
          key={group.id}
        >
          {group.icon?.medium ? (
            <Image
              className="size-9 shrink-0 overflow-hidden rounded-md"
              imageClassName="h-full w-full object-cover"
              imageSrc={group.icon.medium}
            />
          ) : (
            <div className="bg-muted size-9 shrink-0 rounded-md" />
          )}
          <div className="min-w-0 flex-1">
            <div className="line-clamp-1 text-sm font-medium">{group.title || group.name}</div>
            <div className="text-muted-foreground line-clamp-1 text-xs">{group.name}</div>
          </div>
          <span className="text-muted-foreground shrink-0 text-xs">加入小组</span>
        </div>
      ))}
    </div>
  )
}

export function UserTimelineSkeleton({
  className,
  count = 4,
}: {
  className?: string
  count?: number
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <UserTimelineSkeletonItem key={index} />
      ))}
    </div>
  )
}

export function UserTimelineSkeletonItem() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      <div className="flex flex-row justify-between gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="h-14 w-full" />
    </div>
  )
}
