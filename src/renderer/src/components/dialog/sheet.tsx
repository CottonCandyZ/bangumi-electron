import { Sheet as SheetRoot } from '@renderer/components/ui/sheet'
import { SheetGlobalContent } from '@renderer/modules/dialog/sheet/sheet-global-content'
import { openSheetAtom } from '@renderer/state/dialog/sheet'
import { useAtom } from 'jotai'

export function SheetDialog() {
  const [dialogOpen, setDialogOpen] = useAtom(openSheetAtom)
  return (
    <SheetRoot open={dialogOpen} onOpenChange={setDialogOpen}>
      <SheetGlobalContent />
    </SheetRoot>
  )
}
