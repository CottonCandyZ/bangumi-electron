import { LoginInfoDeleteDialogAlertContent } from '@renderer/modules/dialog/alert/login-delete-alert-dailog'
import { alertDialogContentAtom } from '@renderer/state/dialog/alert'
import { useAtomValue } from 'jotai'

export function AlertGlobalContent() {
  const contentName = useAtomValue(alertDialogContentAtom)
  return contentName === 'login-delete-account' && <LoginInfoDeleteDialogAlertContent />
}
