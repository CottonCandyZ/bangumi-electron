import { TagInput } from '@renderer/modules/common/collections/modify/tags/tags-input'
import { Button } from '@renderer/components/ui/button'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionData } from '@renderer/data/types/collection'
import { Subject } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import { Tags } from '@renderer/modules/main/subject/tags/tags'
import { useOpenTagSearchPanel } from '@renderer/modules/main/search/use-open-tag-search-panel'

export function QuickTags({
  subjectTags,
  subjectCollection,
}: {
  subjectTags: Subject['tags']
  subjectCollection: CollectionData | undefined | null
}) {
  const [tags, setTags] = useState(new Set<string>())
  const [edit, setEdit] = useState(false)
  const openTagSearchPanel = useOpenTagSearchPanel()

  const subjectCollectionMutation = useMutationSubjectCollection({
    mutationKey: ['collection-subject'],
    onSuccess() {
      toast.success('标签已保存到本地')
      setEdit(false)
    },
    onError(error) {
      toast.error(error.message || '保存到本地失败')
    },
  })
  const exceed = tags.size > 10
  return (
    <div className="flex flex-col gap-2">
      <Tags
        subjectTags={subjectTags}
        collectionTags={subjectCollection?.tags}
        onTagClicked={(value) => {
          if (!edit) {
            openTagSearchPanel(value)
            return
          }

          setTags((tags) => {
            const newTags = new Set(tags)
            if (tags.has(value)) newTags.delete(value)
            else newTags.add(value)
            return newTags
          })
        }}
        selectedTags={tags}
        edit={edit}
        setEdit={(editing) => {
          if (editing) setTags(new Set(subjectCollection?.tags ?? []))
          setEdit(editing)
        }}
      />
      {edit && (
        <div className="border-input flex w-full flex-col items-start gap-2 rounded-md border bg-transparent p-2 text-sm transition-colors">
          <TagInput
            tags={[...tags]}
            add={(value) => setTags((tags) => new Set(tags).add(value.trim()))}
            remove={(value) =>
              setTags((tags) => {
                const newSet = new Set(tags)
                newSet.delete(value)
                return newSet
              })
            }
          />
          <div className="flex flex-row items-center gap-2">
            <Button
              disabled={exceed || subjectCollectionMutation.isPending}
              onClick={() => {
                if (subjectCollection) {
                  subjectCollectionMutation.mutate({
                    subjectId: subjectCollection.subject_id.toString(),
                    tags: [...tags],
                  })
                }
              }}
            >
              更新
            </Button>
            <Button variant="outline" onClick={() => setEdit(false)}>
              取消
            </Button>
            <Button className="shadow-none" variant="ghost" onClick={() => setTags(new Set())}>
              清除
            </Button>
            <div>
              已选{' '}
              <span className={cn('font-bold text-blue-500', exceed && 'text-destructive')}>
                {tags.size}
              </span>{' '}
              个
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
