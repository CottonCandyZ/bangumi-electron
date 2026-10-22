import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { useOpenReplyComposer } from '@renderer/modules/reply-composer/use-open-reply-composer'
import type { CommentBase } from '@renderer/data/types/comment'
import type { ReplyTarget } from '@shared/reply'
import { MessageCircle } from 'lucide-react'

/** 回复某条评论（或直接评论 target）时传给回复框的内容，按钮和右键菜单共用 */
export function getCommentReplyContent({
  comment,
  floorLabel,
  target,
}: {
  comment?: CommentBase
  floorLabel?: string
  target: ReplyTarget
}) {
  const isTopicReply = target.type === 'group-topic' || target.type === 'subject-topic'
  return {
    replyTo: comment ? (isTopicReply ? comment.id : comment.relatedID || comment.id) : undefined,
    replyToFloor: floorLabel,
    replyToHighlight: comment?.id,
    replyToRoot: comment ? comment.relatedID || comment.id : undefined,
    replyToName: comment?.user?.nickname || comment?.user?.username,
    target,
  }
}

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

  return (
    <Button
      className={cn(
        'text-muted-foreground hover:text-foreground h-7 w-fit px-2 text-xs',
        className,
      )}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => openReplyComposer(getCommentReplyContent({ comment, floorLabel, target }))}
      size="sm"
      type="button"
      variant="ghost"
    >
      <MessageCircle className="size-3.5" />
      {label}
    </Button>
  )
}
