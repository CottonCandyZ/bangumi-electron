import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionData } from '@renderer/data/types/collection'
import { ModifyCollectionOptType } from '@renderer/data/types/modify'
import { cn } from '@renderer/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export default function PrivateSwitch({
  subjectCollection,
  username,
  accessToken,
}: {
  subjectCollection: CollectionData
} & ModifyCollectionOptType) {
  const queryClient = useQueryClient()
  const subjectCollectionMutation = useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onSuccess() {
      toast.success(subjectCollection.private ? '已设为私密' : '已设为公开')
    },
    onError() {
      toast.error('呀，出了点错误...')
    },
    onMutate(variable) {
      queryClient.cancelQueries({
        queryKey: [
          'collection-subject',
          { subjectId: subjectCollection.subject_id.toString(), username },
          accessToken,
        ],
      })
      queryClient.setQueryData(
        [
          'collection-subject',
          { subjectId: subjectCollection.subject_id.toString(), username },
          accessToken,
        ],
        { ...subjectCollection, private: variable.isPrivate! } satisfies CollectionData,
      )
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: [
          'collection-subject',
          { subjectId: subjectCollection.subject_id.toString(), username },
          accessToken,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: ['collection-subjects'],
      })
    },
  })

  return (
    <div
      className={cn('flex items-center gap-2', subjectCollectionMutation.isPending && 'opacity-50')}
    >
      <Label
        className={cn('text-muted-foreground/70', subjectCollection.private && 'text-primary')}
      >
        {subjectCollection.private ? '私密' : '设为私密'}
      </Label>
      <Switch
        checked={subjectCollection.private}
        disabled={subjectCollectionMutation.isPending}
        onCheckedChange={(checked) => {
          subjectCollectionMutation.mutate({
            subjectId: subjectCollection.subject_id.toString(),
            isPrivate: checked,
          })
        }}
      />
    </div>
  )
}
