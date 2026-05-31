import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Card } from '@renderer/components/ui/card'
import { CollectionType, EpisodeCollectionType } from '@renderer/data/types/collection'
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
import {
  COLLECTION_ACTION,
  COLLECTION_TYPE_MAP,
  EPISODE_COLLECTION_TYPE_MAP,
} from '@renderer/lib/utils/map'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'

export { UserTimelineSkeleton, UserTimelineSkeletonItem } from './timeline-skeleton'

export function UserTimelineItemCard({
  className,
  compact = false,
  expanded = false,
  item,
  previewItemLimit,
  showUser = false,
  surface = 'card',
}: {
  className?: string
  compact?: boolean
  expanded?: boolean
  item: UserTimelineItem
  previewItemLimit?: number
  showUser?: boolean
  surface?: 'card' | 'plain' | 'timeline'
}) {
  const statusText = (item.memo.status?.tsukkomi ?? item.memo.status?.sign)?.trim()
  const nicknameChange = item.memo.status?.nickname
  const subjects = limitTimelineItems(item.memo.subject ?? [], previewItemLimit)
  const progress = item.memo.progress
  const progressAction = getProgressTimelineAction(item)
  const batchProgressMeta = progress?.batch ? formatBatchProgressMeta(progress.batch) : undefined
  const hasDetails = hasUserTimelineItemDetails(item)
  const monoCharacters = limitTimelineItems(item.memo.mono?.characters ?? [], previewItemLimit)
  const monoPersons = limitTimelineItems(item.memo.mono?.persons ?? [], previewItemLimit)
  const dailyUsers = limitTimelineItems(item.memo.daily?.users ?? [], previewItemLimit)
  const dailyGroups = limitTimelineItems(item.memo.daily?.groups ?? [], previewItemLimit)

  if (!hasDetails) return null
  const action = getTimelineAction(item)
  const Container = surface === 'card' ? Card : 'div'

  if (surface === 'timeline') {
    return (
      <div className={cn('relative flex min-w-0 flex-row gap-3 pl-1', className)}>
        <div className="flex w-6 shrink-0 justify-center">
          <div className="bg-border/70 relative h-full w-px">
            <div className="bg-background absolute top-0 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full">
              <span
                className={cn(
                  'bg-primary/10 text-primary flex size-5 items-center justify-center rounded-full text-xs',
                  action.icon,
                )}
                title={action.label}
              />
            </div>
          </div>
        </div>
        <div className="border-border/70 min-w-0 flex-1 border-b pb-4">
          <div className="flex min-w-0 flex-col gap-2">
            <TimelineTimelineHeader action={action.label} item={item} showUser={showUser} />

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
                <TimelineRemainingCount
                  count={(item.memo.subject?.length ?? 0) - subjects.length}
                  label="条目"
                />
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

            {item.memo.mono && (monoCharacters.length > 0 || monoPersons.length > 0) && (
              <div className="flex flex-col gap-2">
                {monoCharacters.map((character) => (
                  <TimelineMono
                    item={character}
                    key={`character-${character.id}`}
                    type="character"
                  />
                ))}
                {monoPersons.map((person) => (
                  <TimelineMono item={person} key={`person-${person.id}`} type="person" />
                ))}
                <TimelineRemainingCount
                  count={
                    item.memo.mono.characters.length +
                    item.memo.mono.persons.length -
                    (monoCharacters.length + monoPersons.length)
                  }
                  label="人物"
                />
              </div>
            )}

            {dailyUsers.length > 0 && (
              <TimelineUsers
                remainingCount={(item.memo.daily?.users?.length ?? 0) - dailyUsers.length}
                users={dailyUsers}
              />
            )}

            {dailyGroups.length > 0 && (
              <TimelineGroups
                groups={dailyGroups}
                remainingCount={(item.memo.daily?.groups?.length ?? 0) - dailyGroups.length}
              />
            )}

            <TimelineItemMeta item={item} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <Container
      className={cn(
        'flex flex-col gap-3',
        surface === 'card' ? 'p-3 shadow-none' : 'border-border/70 border-b py-3',
        compact && 'gap-2',
        className,
      )}
    >
      {showUser && item.user && <TimelineItemUser user={item.user} />}

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
          <TimelineRemainingCount
            count={(item.memo.subject?.length ?? 0) - subjects.length}
            label="条目"
          />
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
          meta={progressAction}
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

      {item.memo.mono && (monoCharacters.length > 0 || monoPersons.length > 0) && (
        <div className="flex flex-col gap-2">
          {monoCharacters.map((character) => (
            <TimelineMono item={character} key={`character-${character.id}`} type="character" />
          ))}
          {monoPersons.map((person) => (
            <TimelineMono item={person} key={`person-${person.id}`} type="person" />
          ))}
          <TimelineRemainingCount
            count={
              item.memo.mono.characters.length +
              item.memo.mono.persons.length -
              (monoCharacters.length + monoPersons.length)
            }
            label="人物"
          />
        </div>
      )}

      {dailyUsers.length > 0 && (
        <TimelineUsers
          remainingCount={(item.memo.daily?.users?.length ?? 0) - dailyUsers.length}
          users={dailyUsers}
        />
      )}

      {dailyGroups.length > 0 && (
        <TimelineGroups
          groups={dailyGroups}
          remainingCount={(item.memo.daily?.groups?.length ?? 0) - dailyGroups.length}
        />
      )}

      <TimelineItemMeta item={item} />
    </Container>
  )
}

function TimelineTimelineHeader({
  action,
  item,
  showUser,
}: {
  action: string
  item: UserTimelineItem
  showUser: boolean
}) {
  if (!showUser || !item.user) {
    return <div className="text-muted-foreground text-xs font-medium">{action}</div>
  }

  return (
    <div className="flex min-w-0 flex-row items-center gap-2 text-sm">
      <MyLink
        className="text-foreground hover:text-primary flex min-w-0 flex-row items-center gap-2 font-medium transition-colors"
        to={`/user/${encodeURIComponent(item.user.username)}`}
      >
        {item.user.avatar?.medium ? (
          <Image
            className="size-6 shrink-0 overflow-hidden rounded-full"
            imageClassName="h-full w-full object-cover"
            imageSrc={item.user.avatar.medium}
          />
        ) : (
          <div className="bg-muted size-6 shrink-0 rounded-full" />
        )}
        <span className="line-clamp-1">{item.user.nickname || item.user.username}</span>
      </MyLink>
      <span className="text-muted-foreground shrink-0 text-xs">{action}</span>
    </div>
  )
}

function getTimelineAction(item: UserTimelineItem) {
  if (item.memo.status?.nickname) {
    return { icon: 'i-mingcute-user-setting-line', label: '更新资料' }
  }
  if (item.memo.status?.tsukkomi || item.memo.status?.sign) {
    return { icon: 'i-mingcute-chat-3-line', label: '吐槽' }
  }
  if (item.memo.progress?.single || item.memo.progress?.batch) {
    return { icon: 'i-mingcute-play-circle-line', label: getProgressTimelineAction(item) }
  }
  if ((item.memo.subject?.length ?? 0) > 0) {
    return { icon: 'i-mingcute-star-line', label: getSubjectCollectionTimelineAction(item) }
  }
  if (item.memo.blog) {
    return { icon: 'i-mingcute-edit-2-line', label: '日志' }
  }
  if (item.memo.index) {
    return { icon: 'i-mingcute-list-check-line', label: '目录' }
  }
  if (item.memo.mono?.characters.length || item.memo.mono?.persons.length) {
    return { icon: 'i-mingcute-user-star-line', label: '人物' }
  }
  if (item.memo.daily?.users?.length) {
    return { icon: 'i-mingcute-user-add-line', label: '好友' }
  }
  if (item.memo.daily?.groups?.length) {
    return { icon: 'i-mingcute-group-line', label: '小组' }
  }
  if (item.memo.wiki?.subject) {
    return { icon: 'i-mingcute-book-2-line', label: '维基' }
  }
  return { icon: 'i-mingcute-pulse-line', label: '动态' }
}

function getProgressTimelineAction(item: UserTimelineItem) {
  if (item.memo.progress?.batch) return '看到'

  switch (item.type) {
    case EpisodeCollectionType.wantToWatch:
    case EpisodeCollectionType.watched:
    case EpisodeCollectionType.abandoned:
      return EPISODE_COLLECTION_TYPE_MAP[item.type]
    default:
      return '进度'
  }
}

function getSubjectCollectionTimelineAction(item: UserTimelineItem) {
  const collectionType = getTimelineSubjectCollectionType(item.type)
  const subjectType = item.memo.subject?.[0]?.subject.type

  if (collectionType === undefined || subjectType === undefined) return '收藏'

  return COLLECTION_TYPE_MAP(subjectType)[collectionType] ?? '收藏'
}

function getTimelineSubjectCollectionType(type: number) {
  if (type >= 1 && type <= 4) return CollectionType.wantToWatch
  if (type >= 5 && type <= 8) return CollectionType.watched
  if (type >= 9 && type <= 12) return CollectionType.watching
  if (type === 13) return CollectionType.aside
  if (type === 14) return CollectionType.abandoned
  return undefined
}

function limitTimelineItems<T>(items: T[], limit: number | undefined) {
  return limit === undefined ? items : items.slice(0, limit)
}

function TimelineItemUser({ user }: { user: UserTimelineSlimUser }) {
  return (
    <MyLink
      className="hover:text-primary flex min-w-0 flex-row items-center gap-2 transition-colors"
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
        <div className="text-muted-foreground line-clamp-1 text-xs">@{user.username}</div>
      </div>
    </MyLink>
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
  const action = COLLECTION_ACTION[progress.subject.type] ?? '看'

  const parts = [
    formatProgressPart(progress.epsUpdate, progress.epsTotal, '话'),
    formatProgressPart(progress.volsUpdate, progress.volsTotal, '卷'),
  ].filter((part): part is string => part !== undefined)

  return parts.length > 0 ? `${action}到 ${parts.join(' / ')}` : undefined
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
  meta,
  subject,
}: {
  compact: boolean
  episode: UserTimelineEpisode
  expanded: boolean
  meta?: string
  subject: UserTimelineSlimSubject
}) {
  const episodeTitle = episode.nameCN || episode.name
  const episodeLabel = `ep.${episode.sort}`

  return (
    <TimelineSubject
      subject={subject}
      meta={meta}
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
              !expanded && 'max-h-28 overflow-x-hidden overflow-y-auto pr-2',
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

function TimelineRemainingCount({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null

  return (
    <div className="text-muted-foreground text-xs">
      还有 {count} 个{label}
    </div>
  )
}

function TimelineUsers({
  remainingCount = 0,
  users,
}: {
  remainingCount?: number
  users: UserTimelineSlimUser[]
}) {
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
      <TimelineRemainingCount count={remainingCount} label="用户" />
    </div>
  )
}

function TimelineGroups({
  groups,
  remainingCount = 0,
}: {
  groups: UserTimelineSlimGroup[]
  remainingCount?: number
}) {
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
      <TimelineRemainingCount count={remainingCount} label="小组" />
    </div>
  )
}
