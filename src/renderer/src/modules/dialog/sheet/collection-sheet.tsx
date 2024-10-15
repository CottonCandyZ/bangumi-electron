import { ScrollWrapper } from '@renderer/components/scroll/scroll-wrapper'
import { AddOrModifySubjectCollectionForm } from '@renderer/modules/common/collections/modify/form/subject-form'
import { SheetHeader, SheetTitle } from '@renderer/components/ui/sheet'
import { useAtomValue, useSetAtom } from 'jotai'
import { subjectCollectionSheetFormPropsAtom } from '@renderer/state/dialog/sheet'
import { openDialogAtom } from '@renderer/state/dialog/index'

export function SubjectCollectionContent() {
  const formProps = useAtomValue(subjectCollectionSheetFormPropsAtom)
  const setOpen = useSetAtom(openDialogAtom)
  if (!formProps) return null
  return (
    <>
      <SheetHeader className="pl-6">
        <SheetTitle>{formProps.sheetTitle}</SheetTitle>
      </SheetHeader>
      <ScrollWrapper className="pl-6 pr-4 pt-2" options={{ scrollbars: { autoHide: 'leave' } }}>
        <AddOrModifySubjectCollectionForm {...formProps} success={() => setOpen(false)} />
      </ScrollWrapper>
    </>
  )
}
