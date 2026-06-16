import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { useOpenReplyComposer } from '@renderer/modules/reply-composer/use-open-reply-composer'
import type { CommentBase } from '@renderer/data/types/comment'
import type { ReplyTarget } from '@shared/reply'
import { MessageCircle } from 'lucide-react'

export function CommentReplyButton({
  className,
  comment,
  floorLabel,
  label = '回复',
  target,
}: {
  className?: string
  comment?: CommentBase
  floorLabel?: string
  label?: string
  target: ReplyTarget
}) {
  const openReplyComposer = useOpenReplyComposer()
  const isTopicReply = target.type === 'group-topic' || target.type === 'subject-topic'
  const replyTo = comment
    ? isTopicReply
      ? comment.id
      : comment.relatedID || comment.id
    : undefined
  const replyToRoot = comment ? comment.relatedID || comment.id : undefined

  return (
    <Button
      className={cn(
        'text-muted-foreground hover:text-foreground h-7 w-fit px-2 text-xs',
        className,
      )}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() =>
        openReplyComposer({
          replyTo,
          replyToFloor: floorLabel,
          replyToHighlight: comment?.id,
          replyToRoot,
          replyToName: comment?.user?.nickname || comment?.user?.username,
          target,
        })
      }
      size="sm"
      type="button"
      variant="ghost"
    >
      <MessageCircle className="size-3.5" />
      {label}
    </Button>
  )
}
