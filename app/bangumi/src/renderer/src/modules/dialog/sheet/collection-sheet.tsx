import { AddOrModifySubjectCollectionForm } from '@renderer/modules/common/collections/modify/form/subject-form'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@renderer/components/ui/sheet'
import { useAtom } from 'jotai'
import {
  subjectCollectionSheetFormAtom,
  type SubjectCollectionSheetProps,
} from '@renderer/state/dialog/sheet'
import { useCallback, useEffect, useRef } from 'react'

export function SubjectCollectionSheet() {
  const [sheetProps, setSheetProps] = useAtom(subjectCollectionSheetFormAtom)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setOpen = useCallback(
    (open: boolean) => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
      setSheetProps({ open })

      if (!open) {
        closeTimerRef.current = setTimeout(() => {
          setSheetProps({ open: false, content: null })
          closeTimerRef.current = null
        }, 240)
      }
    },
    [setSheetProps],
  )

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    },
    [],
  )

  return (
    <Sheet open={sheetProps.open} onOpenChange={setOpen}>
      {sheetProps.content && <Content content={sheetProps.content} setOpen={setOpen} />}
    </Sheet>
  )
}

function Content({
  content,
  setOpen,
}: {
  content: SubjectCollectionSheetProps
  setOpen: (open: boolean) => void
}) {
  const { sheetTitle, ...formProps } = content

  return (
    <SheetContent className="gap-0 p-0" style={{ width: 'min(92vw, 38rem)', maxWidth: '38rem' }}>
      <SheetHeader className="border-border/70 border-b px-5 py-4 pr-12 text-left">
        <SheetTitle className="text-base">{sheetTitle}</SheetTitle>
      </SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <AddOrModifySubjectCollectionForm {...formProps} success={() => setOpen(false)} />
      </div>
    </SheetContent>
  )
}
