import { ScrollWrapper } from '@renderer/components/scroll/scroll-wrapper'
import { AddOrModifySubjectCollectionForm } from '@renderer/modules/common/collections/modify/form/subject-form'
import { SheetContent, SheetHeader, SheetTitle } from '@renderer/components/ui/sheet'
import { useAtomValue, useSetAtom } from 'jotai'
import { openSheetAtom, subjectCollectionSheetFormPropsAtom } from '@renderer/state/dialog/sheet'

export function SubjectCollectionContent() {
  const formProps = useAtomValue(subjectCollectionSheetFormPropsAtom)
  const setOpen = useSetAtom(openSheetAtom)
  if (!formProps) return null
  return (
    <SheetContent className="flex w-1/3 flex-col pl-0 pr-2 sm:max-w-none">
      <SheetHeader className="pl-6">
        <SheetTitle>{formProps.sheetTitle}</SheetTitle>
      </SheetHeader>
      <ScrollWrapper className="pl-6 pr-4 pt-2" options={{ scrollbars: { autoHide: 'leave' } }}>
        <AddOrModifySubjectCollectionForm {...formProps} success={() => setOpen(false)} />
      </ScrollWrapper>
    </SheetContent>
  )
}
