import SubjectCollectionContent from '@renderer/components/sheet/collection-sheet'
import { SheetContent } from '@renderer/components/ui/sheet'
import { sheetContentNameAtom } from '@renderer/state/sheet'
import { useAtomValue } from 'jotai'

export default function SheetContentWrapper() {
  const contentName = useAtomValue(sheetContentNameAtom)

  return (
    <SheetContent className="flex w-1/3 flex-col pl-0 pr-2 sm:max-w-none">
      {contentName === 'subject-collection' && <SubjectCollectionContent />}
    </SheetContent>
  )
}
