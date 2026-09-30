import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
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
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="修改详情"
          className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-7 items-center justify-center rounded-md transition-colors"
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
          <span className="i-mingcute-edit-2-line" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">修改详情</TooltipContent>
    </Tooltip>
  )
}
