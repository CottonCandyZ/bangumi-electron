import { Button } from '@renderer/components/ui/button'
import { canEditReply } from '@renderer/data/fetch/api/reply'
import { useSession } from '@renderer/data/hooks/session'
import type { CommentBase } from '@renderer/data/types/comment'
import { cn } from '@renderer/lib/utils'
import { useOpenReplyComposer } from '@renderer/modules/reply-composer/use-open-reply-composer'
import type { ReplyTarget } from '@shared/reply'
import { Pencil } from 'lucide-react'

export function CommentEditButton({
  className,
  comment,
  target,
}: {
  className?: string
  comment: CommentBase
  target: ReplyTarget
}) {
  const session = useSession()
  const openReplyComposer = useOpenReplyComposer()
  const canEdit = canEditReply(target) && session !== undefined && session?.id === comment.creatorID

  if (!canEdit) return null

  return (
    <Button
      className={cn(
        'text-muted-foreground hover:text-foreground h-7 w-fit px-2 text-xs',
        className,
      )}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() =>
        openReplyComposer({
          draft: comment.content,
          editCommentId: comment.id,
          target,
        })
      }
      size="sm"
      type="button"
      variant="ghost"
    >
      <Pencil className="size-3.5" />
      编辑
    </Button>
  )
}
