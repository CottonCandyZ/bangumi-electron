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
import { submitCollection } from '@renderer/data/collection/client'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAtom } from 'jotai'
import { deleteCollectionDialogAtom } from '@renderer/state/dialog/alert'
export function DeleteSubjectCollectionAlert() {
  const [dialog, setDialog] = useAtom(deleteCollectionDialogAtom)
  const mutation = useMutation({
    networkMode: 'always',
    mutationFn: (subjectId: number) => submitCollection({ kind: 'remove', subjectId }),
    onSuccess() {
      setDialog({ open: false })
      toast.success('已在本地取消收藏，联网后同步')
    },
    onError(error) {
      toast.error(error.message)
    },
  })
  return (
    <AlertDialog open={dialog.open} onOpenChange={(open) => setDialog({ open })}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>取消这个条目的收藏？</AlertDialogTitle>
          <AlertDialogDescription>
            会先保存到本地，联网后同步。已保存的资料和章节记录会保留，你可以再次收藏。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>保留收藏</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={mutation.isPending}
            onClick={(event) => {
              event.preventDefault()
              if (dialog.content?.subjectId) mutation.mutate(Number(dialog.content.subjectId))
            }}
          >
            取消收藏
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
