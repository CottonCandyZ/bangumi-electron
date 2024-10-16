import { SubjectCollectionContent } from '@renderer/modules/dialog/sheet/collection-sheet'
import { sheetContentNameAtom } from '@renderer/state/dialog/sheet'
import { useAtomValue } from 'jotai'

export function SheetGlobalContent() {
  const contentName = useAtomValue(sheetContentNameAtom)

  return contentName === 'subject-collection' && <SubjectCollectionContent />
}
