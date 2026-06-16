import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@renderer/components/ui/alert-dialog'
import { Button } from '@renderer/components/ui/button'
import { canDeleteReply } from '@renderer/data/fetch/api/reply'
import { useDeleteReplyMutation } from '@renderer/data/hooks/api/reply'
import { useSession } from '@renderer/data/hooks/session'
import type { CommentBase } from '@renderer/data/types/comment'
import { cn } from '@renderer/lib/utils'
import type { ReplyTarget } from '@shared/reply'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function CommentDeleteButton({
  className,
  comment,
  target,
}: {
  className?: string
  comment: CommentBase
  target: ReplyTarget
}) {
  const session = useSession()
  const mutation = useDeleteReplyMutation()
  const canDelete =
    canDeleteReply(target) && session !== undefined && session?.id === comment.creatorID

  if (!canDelete) return null

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          aria-label="删除"
          className={cn(
            'text-muted-foreground hover:text-destructive h-7 w-fit px-2 text-xs',
            className,
          )}
          disabled={mutation.isPending}
          onMouseDown={(event) => event.preventDefault()}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Trash2 className="size-3.5" />
          删除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确定要删除这条回复吗？</AlertDialogTitle>
          <AlertDialogDescription>删除后不可撤销。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate(
                { commentId: comment.id, target },
                {
                  onSuccess: () => toast.success('删除成功'),
                  onError: (error) =>
                    toast.error(error instanceof Error ? error.message : '删除失败'),
                },
              )
            }
            variant="destructive"
          >
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
