import { DialogContent } from '@renderer/components/ui/dialog'
import { LoginDialog } from '@renderer/modules/dialog/normal/login-dialog'
import { normalDialogContentAtom } from '@renderer/state/dialog/normal'
import { useAtomValue } from 'jotai'

export function DialogGlobalContent() {
  const contentName = useAtomValue(normalDialogContentAtom)

  return (
    <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
      {contentName === 'login-form' && <LoginDialog />}
    </DialogContent>
  )
}

// export function AlertDialogWrapper() {

// }
