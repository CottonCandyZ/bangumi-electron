import { Button } from '@renderer/components/ui/button'
import { useResourceCollectionMutation } from '@renderer/data/hooks/api/collection'
import { useSession } from '@renderer/data/hooks/session'
import type { P1ToggleCollectionResourceType } from '@renderer/data/types/collection'
import { cn } from '@renderer/lib/utils'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { useSetAtom } from 'jotai'
import { BookmarkCheck, BookmarkPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type ResourceCollectionButtonProps = {
  className?: string
  collected: boolean
  disabled?: boolean
  loading?: boolean
  resourceId: number
  resourceType: P1ToggleCollectionResourceType
}

export function ResourceCollectionButton({
  className,
  collected,
  disabled,
  loading,
  resourceId,
  resourceType,
}: ResourceCollectionButtonProps) {
  const session = useSession()
  const openLoginDialog = useSetAtom(loginDialogAtom)
  const mutation = useResourceCollectionMutation()
  const pending = mutation.isPending

  const handleClick = async () => {
    if (session === null) {
      openLoginDialog({ open: true })
      return
    }
    if (!session || !Number.isFinite(resourceId)) return

    try {
      await mutation.mutateAsync({
        collected: !collected,
        resourceId,
        resourceType,
      })
      toast.success(collected ? '已取消收藏' : '已收藏')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : collected ? '取消收藏失败' : '收藏失败')
    }
  }

  return (
    <Button
      className={cn('gap-1.5', className)}
      disabled={
        disabled || loading || pending || session === undefined || !Number.isFinite(resourceId)
      }
      onClick={handleClick}
      size="sm"
      variant={collected ? 'outline' : 'default'}
    >
      {pending || loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : collected ? (
        <BookmarkCheck className="size-3.5" />
      ) : (
        <BookmarkPlus className="size-3.5" />
      )}
      {collected ? '取消收藏' : '收藏'}
    </Button>
  )
}
