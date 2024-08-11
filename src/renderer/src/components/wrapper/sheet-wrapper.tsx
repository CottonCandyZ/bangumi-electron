import SubjectCollectionContent from '@renderer/components/sheet/collection-sheet'
import { Sheet, SheetContent } from '@renderer/components/ui/sheet'
import { openSheetAtom, sheetContentNameAtom } from '@renderer/state/sheet'
import { useAtom, useAtomValue } from 'jotai'
import { PropsWithChildren } from 'react'

export default function SheetWrapper({ children }: PropsWithChildren) {
  const [open, setOpen] = useAtom(openSheetAtom)
  const contentName = useAtomValue(sheetContentNameAtom)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children}
      <SheetContent className="flex w-1/3 flex-col pl-0 pr-2 sm:max-w-none">
        {contentName === 'subject-collection' && <SubjectCollectionContent />}
      </SheetContent>
    </Sheet>
  )
}
