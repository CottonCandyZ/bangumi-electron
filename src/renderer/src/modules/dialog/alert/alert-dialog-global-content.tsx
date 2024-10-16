import { DeleteSubjectCollectionAlert } from '@renderer/modules/dialog/alert/delete-subject-collection'
import { LoginInfoDeleteDialogAlertContent } from '@renderer/modules/dialog/alert/login-delete-alert-dailog'
import { alertDialogContentAtom } from '@renderer/state/dialog/alert'
import { useAtomValue } from 'jotai'

export function AlertGlobalContent() {
  const contentName = useAtomValue(alertDialogContentAtom)
  return (
    <>
      {contentName === 'login-delete-account' && <LoginInfoDeleteDialogAlertContent />}
      {contentName === 'delete-subject-collection' && <DeleteSubjectCollectionAlert />}
    </>
  )
}
