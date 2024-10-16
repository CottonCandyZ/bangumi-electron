import { AlertDialog as AlertDialogRoot } from '@renderer/components/ui/alert-dialog'
import { AlertGlobalContent } from '@renderer/modules/dialog/alert/alert-dialog-global-content'
import { openAlertDialogAtom } from '@renderer/state/dialog/alert'
import { useAtom } from 'jotai'

export function AlertDialog() {
  const [dialogOpen, setDialogOpen] = useAtom(openAlertDialogAtom)
  return (
    <AlertDialogRoot open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertGlobalContent />
    </AlertDialogRoot>
  )
}
