import TagInput from '@renderer/components/collections/modify/tags-input'
import Tags from '@renderer/components/subject/tags/tags'
import { Button } from '@renderer/components/ui/button'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { CollectionData } from '@renderer/data/types/collection'
import { Subject } from '@renderer/data/types/subject'
import { UserInfo } from '@renderer/data/types/user'
import { cn } from '@renderer/lib/utils'
import { useEditTags } from '@renderer/state/edit'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function QuickTags({
  subjectTags,
  subjectCollection,
  userInfo,
  accessToken,
}: {
  subjectTags: Subject['tags']
  subjectCollection: CollectionData | undefined | null
  userInfo: UserInfo | undefined
  accessToken: string | undefined
}) {
  const [tags, setTags] = useState(new Set<string>())
  const queryClient = useQueryClient()
  const { edit, setEdit } = useEditTags((state) => state)

  useEffect(() => {
    setEdit(false)
  }, [subjectTags])

  useEffect(() => {
    if (subjectCollection) {
      setTags(new Set(subjectCollection.tags))
    }
  }, [subjectCollection?.tags, edit])

  const subjectCollectionMutation = useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onSuccess() {
      toast.success(subjectCollection && '修改成功')
      setEdit(false)
    },
    onError() {
      toast.error('呀，出了点错误...')
    },
    onMutate(variable) {
      if (subjectCollection && userInfo) {
        queryClient.cancelQueries({
          queryKey: [
            'collection-subject',
            { subjectId: subjectCollection.subject_id.toString(), username: userInfo.username },
            accessToken,
          ],
        })
        queryClient.setQueryData(
          [
            'collection-subject',
            { subjectId: subjectCollection.subject_id.toString(), username: userInfo.username },
            accessToken,
          ],
          { ...subjectCollection, tags: variable.tags! } satisfies CollectionData,
        )
      }
    },
    onSettled() {
      if (subjectCollection && userInfo)
        queryClient.invalidateQueries({
          queryKey: [
            'collection-subject',
            {
              subjectId: subjectCollection.subject_id.toString(),
              username: userInfo.username,
              accessToken,
            },
          ],
        })
      queryClient.invalidateQueries({
        queryKey: ['collection-subjects'],
      })
    },
  })
  const exceed = tags.size > 10
  return (
    <div className="flex flex-col gap-2">
      <Tags
        subjectTags={subjectTags}
        collectionTags={subjectCollection?.tags}
        onTagClicked={(value) =>
          setTags((tags) => {
            const newTags = new Set(tags)
            if (tags.has(value)) newTags.delete(value)
            else newTags.add(value)
            return newTags
          })
        }
        selectedTags={tags}
        edit={edit}
        setEdit={setEdit}
      />
      {edit && (
        <div className="flex w-full flex-col items-start gap-2 rounded-md border border-input bg-transparent p-2 text-sm shadow-sm transition-colors">
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
            <Button variant="secondary" onClick={() => setTags(new Set())}>
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
