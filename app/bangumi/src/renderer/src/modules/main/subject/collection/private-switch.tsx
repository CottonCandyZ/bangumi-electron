import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionData } from '@renderer/data/types/collection'
import { cn } from '@renderer/lib/utils'
import { toast } from 'sonner'

export function PrivateSwitch({ subjectCollection }: { subjectCollection: CollectionData }) {
  const subjectCollectionMutation = useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onError(error) {
      toast.error(error.message || '私密设置更新失败，请重试')
    },
  })
  const isPrivate = subjectCollection.private
  const label = isPrivate ? '私密收藏，点击公开' : '设为私密'

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={isPrivate}
          disabled={subjectCollectionMutation.isPending}
          onClick={() => {
            subjectCollectionMutation.mutate({
              subjectId: subjectCollection.subject_id.toString(),
              isPrivate: !isPrivate,
            })
          }}
          className={cn(
            'hover:bg-accent flex size-7 items-center justify-center rounded-md transition-colors disabled:opacity-50',
            isPrivate ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <span className={isPrivate ? 'i-mingcute-lock-fill' : 'i-mingcute-unlock-line'} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}
