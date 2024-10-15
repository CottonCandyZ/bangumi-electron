import { Dialog as DialogRoot } from '@renderer/components/ui/dialog'
import { DialogGlobalContent } from '@renderer/modules/dialog/normal/dialog-global-content'
import { SheetGlobalContent } from '@renderer/modules/dialog/sheet/sheet-global-content'
import { dialogTypeAtom, openDialogAtom } from '@renderer/state/dialog/index'
import { useAtom, useAtomValue } from 'jotai'

export function Dialog() {
  const [dialogOpen, setDialogOpen] = useAtom(openDialogAtom)
  const dialogType = useAtomValue(dialogTypeAtom)
  return (
    <DialogRoot open={dialogOpen} onOpenChange={setDialogOpen}>
      {dialogType === 'sheet' && <SheetGlobalContent />}
      {dialogType === 'normal' && <DialogGlobalContent />}
    </DialogRoot>
  )
}
