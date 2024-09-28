import { ScrollWrapper } from '@renderer/components/scroll/scroll-wrapper'
import { AddOrModifySubjectCollectionForm } from '@renderer/modules/common/collections/modify/form/subject-form'
import { SheetHeader, SheetTitle } from '@renderer/components/ui/sheet'
import { openSheetAtom, subjectCollectionSheetFormPropsAtom } from '@renderer/state/sheet'
import { useAtomValue, useSetAtom } from 'jotai'

export function SubjectCollectionContent() {
  const formProps = useAtomValue(subjectCollectionSheetFormPropsAtom)
  const setOpen = useSetAtom(openSheetAtom)
  if (!formProps) return null
  return (
    <>
      <SheetHeader className="pl-6">
        <SheetTitle>添加收藏</SheetTitle>
      </SheetHeader>
      <ScrollWrapper className="pl-6 pr-4 pt-2" options={{ scrollbars: { autoHide: 'leave' } }}>
        <AddOrModifySubjectCollectionForm {...formProps} setOpen={setOpen} />
      </ScrollWrapper>
    </>
  )
}
