import { Button } from '@renderer/components/ui/button'
import { CollectionData } from '@renderer/data/types/collection'
import { Subject } from '@renderer/data/types/subject'
import { subjectCollectionSheetFormAtom } from '@renderer/state/dialog/sheet'
import { useSetAtom } from 'jotai'

export function ModifySubjectCollection({
  subjectCollection,
  subjectInfo,
}: {
  subjectCollection: CollectionData
  subjectInfo: Subject
}) {
  const sheetAction = useSetAtom(subjectCollectionSheetFormAtom)
  return (
    <Button
      variant="outline"
      onClick={() => {
        sheetAction({
          open: true,
          content: {
            sheetTitle: '修改收藏',
            collectionType: subjectCollection.type,
            subjectId: subjectCollection.subject_id.toString(),
            subjectTags: subjectInfo.tags,
            subjectType: subjectCollection.subject_type,
            comment: subjectCollection.comment ?? '',
            isPrivate: subjectCollection.private,
            rate: subjectCollection.rate,
            tags: subjectCollection.tags,
            modify: true,
          },
        })
      }}
    >
      修改详情
    </Button>
  )
}
