import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { useSession } from '@renderer/modules/wrapper/session-wrapper'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionData } from '@renderer/data/types/collection'
import { cn } from '@renderer/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useQueryKeyWithAccessToken } from '@renderer/data/hooks/factory'

export function PrivateSwitch({ subjectCollection }: { subjectCollection: CollectionData }) {
  const queryClient = useQueryClient()
  const { userInfo } = useSession()
  const username = userInfo?.username
  const queryKey = useQueryKeyWithAccessToken([
    'collection-subject',
    { subjectId: subjectCollection.subject_id.toString(), username },
  ])
  const subjectCollectionMutation = useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onSuccess() {
      toast.success(subjectCollection.private ? '已设为私密' : '已设为公开')
    },
    onError(_error, _variable, context) {
      toast.error('呀，出了点错误...')
      queryClient.setQueryData(queryKey, (context as { pre: CollectionData }).pre)
    },
    onMutate(variable) {
      queryClient.cancelQueries({
        queryKey,
      })
      const pre = queryClient.getQueryData<CollectionData>(queryKey)
      queryClient.setQueryData<CollectionData>(queryKey, {
        ...subjectCollection,
        private: variable.isPrivate!,
      })
      return { pre }
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey,
      })
      queryClient.invalidateQueries({
        queryKey: ['collection-subjects'],
      })
    },
  })

  return (
    <div className={cn('flex items-center gap-2')}>
      <Label
        htmlFor="private-switch"
        className={cn('text-muted-foreground/70', subjectCollection.private && 'text-primary')}
      >
        {subjectCollection.private ? '私密' : '设为私密'}
      </Label>
      <Switch
        id="private-switch"
        checked={subjectCollection.private}
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
