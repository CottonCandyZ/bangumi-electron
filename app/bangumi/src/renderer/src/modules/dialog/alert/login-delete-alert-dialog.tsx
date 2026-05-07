import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@renderer/components/ui/alert-dialog'
import { deleteLoginAccountDialogAtom, DeleteLoginAccountProps } from '@renderer/state/dialog/alert'
import { useAtom } from 'jotai'

export function LoginInfoDeleteDialogAlertContent() {
  const [openDialog, setDialogOpen] = useAtom(deleteLoginAccountDialogAtom)
  return (
    <AlertDialog open={openDialog.open} onOpenChange={(open) => setDialogOpen({ open })}>
      {openDialog.content && <Content {...openDialog.content} />}
    </AlertDialog>
  )
}

const Content = (props: DeleteLoginAccountProps) => {
  const { email, onDeleted } = props
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确定要移除吗？</AlertDialogTitle>
        <AlertDialogDescription>这将会移除 {email}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction variant="destructive" onClick={onDeleted}>
          确定
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
