import { LoginDialog } from '@renderer/modules/dialog/normal/login-dialog'
import { normalDialogContentAtom } from '@renderer/state/dialog/normal'
import { useAtomValue } from 'jotai'

export function DialogGlobalContent() {
  const contentName = useAtomValue(normalDialogContentAtom)
  return contentName === 'login-form' && <LoginDialog />
}
