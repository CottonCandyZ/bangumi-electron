import { Dialog as DialogRoot } from '@renderer/components/ui/dialog'
import { DialogGlobalContent } from '@renderer/modules/dialog/normal/dialog-global-content'
import { openDialogAtom } from '@renderer/state/dialog/normal'
import { useAtom } from 'jotai'

export function NormalDialog() {
  const [dialogOpen, setDialogOpen] = useAtom(openDialogAtom)
  return (
    <DialogRoot open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogGlobalContent />
    </DialogRoot>
  )
}
