import { ScrollWrapper } from '@renderer/components/scroll/scroll-wrapper'
import { AddOrModifySubjectCollectionForm } from '@renderer/modules/common/collections/modify/form/subject-form'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@renderer/components/ui/sheet'
import { useAtom } from 'jotai'
import {
  subjectCollectionSheetFormAtom,
  SubjectCollectionSheetProps,
} from '@renderer/state/dialog/sheet'

export function SubjectCollectionSheet() {
  const [sheetProps, setSheetProps] = useAtom(subjectCollectionSheetFormAtom)
  const setOpen = (open: boolean) => setSheetProps({ open })
  return (
    <Sheet open={sheetProps.open} onOpenChange={setOpen}>
      {sheetProps.content && <Content content={sheetProps.content} setOpen={setOpen} />}
    </Sheet>
  )
}

function Content(props: {
  content: SubjectCollectionSheetProps
  setOpen: (open: boolean) => void
}) {
  const { sheetTitle, ...formProps } = props.content
  return (
    <SheetContent className="flex w-1/3 flex-col pl-0 pr-2 sm:max-w-none">
      <SheetHeader className="pl-6">
        <SheetTitle>{sheetTitle}</SheetTitle>
      </SheetHeader>
      <ScrollWrapper className="pl-6 pr-4 pt-2" options={{ scrollbars: { autoHide: 'leave' } }}>
        <AddOrModifySubjectCollectionForm {...formProps} success={() => props.setOpen(false)} />
      </ScrollWrapper>
    </SheetContent>
  )
}
