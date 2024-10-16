import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@renderer/components/ui/alert-dialog'
import { loginDeleteAccountPropsAtom } from '@renderer/state/dialog/alert'
import { useAtomValue } from 'jotai'

export function LoginInfoDeleteDialogAlertContent() {
  const props = useAtomValue(loginDeleteAccountPropsAtom)
  if (!props) throw Error('Props 传丢了')
  const { email, onDeleted } = props
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确定要移除吗？</AlertDialogTitle>
        <AlertDialogDescription>这将会移除 {email}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction variant={'destructive'} onClick={onDeleted}>
          确定
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
