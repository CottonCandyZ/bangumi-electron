import { SheetContent } from '@renderer/components/ui/sheet'
import { SubjectCollectionContent } from '@renderer/modules/dialog/sheet/collection-sheet'
import { sheetContentNameAtom } from '@renderer/state/dialog/sheet'
import { useAtomValue } from 'jotai'

export function SheetGlobalContent() {
  const contentName = useAtomValue(sheetContentNameAtom)

  return (
    <SheetContent className="flex w-1/3 flex-col pl-0 pr-2 sm:max-w-none">
      {contentName === 'subject-collection' && <SubjectCollectionContent />}
    </SheetContent>
  )
}
