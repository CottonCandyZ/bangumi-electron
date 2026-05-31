import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { useOpenReplyComposer } from '@renderer/modules/reply-composer/use-open-reply-composer'
import type { CommentBase } from '@renderer/data/types/comment'
import type { ReplyTarget } from '@shared/reply'
import { MessageCircle } from 'lucide-react'

export function CommentReplyButton({
  className,
  comment,
  label = '回复',
  target,
}: {
  className?: string
  comment?: CommentBase
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
      onClick={() =>
        openReplyComposer({
          replyTo: comment ? comment.relatedID || comment.id : undefined,
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
