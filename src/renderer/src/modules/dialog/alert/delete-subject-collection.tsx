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
import { useSession } from '@renderer/modules/wrapper/session-wrapper'
import { deleteSubjectCollectionById } from '@renderer/data/fetch/web/collection'
import { useWebDeleteCollectionHash } from '@renderer/data/hooks/web/collection'
import { CollectionData } from '@renderer/data/types/collection'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAtomValue } from 'jotai'
import { deleteCollectionPropsAtom } from '@renderer/state/dialog/alert'

export function DeleteSubjectCollectionAlert() {
  const props = useAtomValue(deleteCollectionPropsAtom)
  if (!props) throw Error('Props 传丢了')
  const { subjectId } = props

  const { userInfo, accessToken } = useSession()
  const username = userInfo?.username
  const hash = useWebDeleteCollectionHash({ subjectId }).data
  const queryClient = useQueryClient()
  const subjectCollectionMutation = useMutation({
    mutationFn: deleteSubjectCollectionById,
    onSuccess() {
      toast.success('删除成功！')
    },
    onError(_error, _variable, context) {
      toast.error('呀，出了点错误...')
      queryClient.setQueryData(
        ['collection-subject', { subjectId, username }, accessToken],
        (context as { pre: CollectionData }).pre,
      )
    },
    onMutate() {
      queryClient.cancelQueries({
        queryKey: ['collection-subject', { subjectId, username }, accessToken],
      })
      const pre = queryClient.getQueryData([
        'collection-subject',
        { subjectId, username },
        accessToken,
      ])
      queryClient.setQueryData(['collection-subject', { subjectId, username }, accessToken], null)
      return { pre }
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
