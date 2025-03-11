import { DeleteSubjectCollectionAlert } from '@renderer/modules/dialog/alert/delete-subject-collection'
import { LoginInfoDeleteDialogAlertContent } from '@renderer/modules/dialog/alert/login-delete-alert-dailog'

export function AlertDialog() {
  return (
    <>
      <LoginInfoDeleteDialogAlertContent />
      <DeleteSubjectCollectionAlert />
    </>
  )
}
