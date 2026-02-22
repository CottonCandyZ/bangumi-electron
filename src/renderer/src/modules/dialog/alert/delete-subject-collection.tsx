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
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { useSessionUsername } from '@renderer/data/hooks/session'
import { deleteSubjectCollectionById } from '@renderer/data/fetch/web/collection'
import { useWebDeleteCollectionHash } from '@renderer/data/hooks/web/collection'
import { CollectionData } from '@renderer/data/types/collection'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAtom } from 'jotai'
import { deleteCollectionDialogAtom, DeleteCollectionProps } from '@renderer/state/dialog/alert'

export function DeleteSubjectCollectionAlert() {
  const [dialogOpen, setDialogOpen] = useAtom(deleteCollectionDialogAtom)

  return (
    <AlertDialog open={dialogOpen.open} onOpenChange={(open) => setDialogOpen({ open })}>
      {dialogOpen.content && <Content {...dialogOpen.content} />}
    </AlertDialog>
  )
}

const Content = (props: DeleteCollectionProps) => {
  const { subjectId } = props
  const username = useSessionUsername()
  const hash = useWebDeleteCollectionHash({ subjectId }).data
  const queryClient = useQueryClient()
  const queryKey = ['collection-subject', { subjectId, username }]
  const subjectCollectionMutation = useMutation({
    mutationFn: deleteSubjectCollectionById,
    onSuccess() {
      toast.success('删除成功！')
    },
    onError(_error, _variable, context) {
      toast.error('呀，出了点错误...')
      queryClient.setQueryData(queryKey, (context as { pre: CollectionData }).pre)
    },
    onMutate() {
      queryClient.cancelQueries({
        queryKey,
      })
      const pre = queryClient.getQueryData<CollectionData>(queryKey)
      queryClient.setQueryData<CollectionData | null>(queryKey, null)
      return { pre }
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey,
      })
      queryClient.invalidateQueries({
        queryKey: ['collection-subjects'],
      })
    },
  })
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确定要移除该条目的收藏吗?</AlertDialogTitle>
        <AlertDialogDescription>
          这个动作暂时不可以撤销哦！这个动作暂时没有提供 API，所以使用网页 hash 可能不太稳定。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>

        {hash ? (
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              if (subjectId === null) return
              subjectCollectionMutation.mutate({ subjectId, hash })
            }}
          >
            删除
          </AlertDialogAction>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <AlertDialogAction
                variant="destructive"
                className="text-destructive-foreground cursor-not-allowed opacity-50"
                onClick={(e) => {
                  e.preventDefault()
                }}
              >
                删除
              </AlertDialogAction>
            </TooltipTrigger>
            <TooltipContent side="bottom">在从网页获得删除 hash 中...</TooltipContent>
          </Tooltip>
        )}
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
