import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@renderer/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { deleteSubjectCollectionById } from '@renderer/data/fetch/web/collection'
import { useWebDeleteCollectionHash } from '@renderer/data/hooks/web/collection'
import { SubjectId } from '@renderer/data/types/bgm'
import { ModifyCollectionOptType } from '@renderer/data/types/modify'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export default function DeleteSubjectCollectionAlert({
  subjectId,
  username,
  accessToken,
}: { subjectId: SubjectId } & ModifyCollectionOptType) {
  const hash = useWebDeleteCollectionHash({ subjectId }).data
  const queryClient = useQueryClient()
  const subjectCollectionMutation = useMutation({
    mutationFn: deleteSubjectCollectionById,
    onSuccess() {
      toast.success('删除成功！')
    },
    onError() {
      toast.error('呀，出了点错误...')
    },
    onMutate() {
      queryClient.cancelQueries({
        queryKey: ['collection-subject', { subjectId, username }, accessToken],
      })
      queryClient.setQueryData(['collection-subject', { subjectId, username }, accessToken], null)
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: ['collection-subject', { subjectId, username }, accessToken],
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
            variant={'destructive'}
            onClick={() => subjectCollectionMutation.mutate({ subjectId, hash })}
          >
            删除
          </AlertDialogAction>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <AlertDialogAction
                variant={'destructive'}
                className="cursor-not-allowed opacity-50"
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