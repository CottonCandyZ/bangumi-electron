import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionData } from '@renderer/data/types/collection'
import { cn } from '@renderer/lib/utils'
import { toast } from 'sonner'

export function PrivateSwitch({ subjectCollection }: { subjectCollection: CollectionData }) {
  const subjectCollectionMutation = useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onSuccess() {
      toast.success('私密设置已保存到本地')
    },
    onError(error) {
      toast.error(error.message || '保存到本地失败')
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
