import { Image } from '@renderer/components/image/image'
import type { CommunityTopic } from '@renderer/data/types/community'
import { cn } from '@renderer/lib/utils'

export type CommunityTopicLeadingKind = 'creator' | 'source'

export function getCommunityTopicLeadingKind(topic: CommunityTopic): CommunityTopicLeadingKind {
  return topic.kind === 'group' ? 'creator' : 'source'
}

export function getCommunityTopicLeadingTitle(
  topic: CommunityTopic,
  kind: CommunityTopicLeadingKind,
) {
  return kind === 'creator' ? (topic.creator?.nickname ?? `#${topic.id}`) : topic.source.title
}

export function CommunityTopicLeadingImage({
  className,
  iconClassName,
  kind,
  loading,
  topic,
}: {
  className?: string
  iconClassName?: string
  kind?: CommunityTopicLeadingKind
  loading?: 'eager' | 'lazy'
  topic: CommunityTopic
}) {
  const resolvedKind = kind ?? getCommunityTopicLeadingKind(topic)
  const image =
    resolvedKind === 'creator'
      ? topic.creator?.avatar.medium || topic.creator?.avatar.small
      : topic.source.image
  const icon = resolvedKind === 'creator' ? 'i-mingcute-user-3-line' : getSourceFallbackIcon(topic)

  if (image) {
    return (
      <Image
        className={cn('bg-muted shrink-0 overflow-hidden rounded-md', className)}
        imageSrc={image}
        loading={loading}
      />
    )
  }

  return (
    <div
      className={cn(
        'bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-md',
        resolvedKind === 'source' && topic.kind === 'trending-subject' && 'text-primary',
        className,
      )}
    >
      <span className={cn(icon, iconClassName)} />
    </div>
  )
}

function getSourceFallbackIcon(topic: CommunityTopic) {
  return topic.kind === 'group' ? 'i-mingcute-group-3-line' : 'i-mingcute-book-6-line'
}
