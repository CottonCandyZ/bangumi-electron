import { CommentBox } from '@renderer/components/comment/comment-box'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@renderer/components/ui/alert-dialog'
import { Button } from '@renderer/components/ui/button'
import { Textarea } from '@renderer/components/ui/textarea'
import { ReportButton } from '@renderer/components/report-button'
import { useCreateReplyMutation } from '@renderer/data/hooks/api/reply'
import {
  useDeleteTimelineMutation,
  useTimelineRepliesQuery,
} from '@renderer/data/hooks/api/timeline'
import { useSession } from '@renderer/data/hooks/session'
import type { UserTimelineItem } from '@renderer/data/types/user'
import { client } from '@renderer/lib/client'
import { markdownToBBCode } from '@renderer/lib/utils/markdown-bbcode'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import type { ReplyTarget } from '@shared/reply'
import { useSetAtom } from 'jotai'
import { Loader2, MessageCircle, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function TimelineStatusActions({ item }: { item: UserTimelineItem }) {
  const [showReplies, setShowReplies] = useState(false)
  const session = useSession()
  const deleteMutation = useDeleteTimelineMutation()
  const repliesQuery = useTimelineRepliesQuery({ enabled: showReplies, timelineId: item.id })
  const replyTarget = { id: item.id, type: 'timeline' } as const
  const canDelete = session !== undefined && session?.id === item.uid

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row items-center gap-1">
        <Button
          className="text-muted-foreground h-7 w-fit gap-1.5 px-2 text-xs"
          onClick={() => setShowReplies((value) => !value)}
          size="sm"
          type="button"
          variant="ghost"
        >
          <MessageCircle className="size-3.5" />
          {showReplies ? '收起回复' : item.replies > 0 ? `查看 ${item.replies} 条回复` : '回复'}
        </Button>
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="text-muted-foreground hover:text-destructive h-7 w-fit gap-1.5 px-2 text-xs"
                disabled={deleteMutation.isPending}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Trash2 className="size-3.5" />
                删除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确定要删除这条状态吗？</AlertDialogTitle>
                <AlertDialogDescription>删除后不可撤销。</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteMutation.isPending}
                  onClick={() =>
                    deleteMutation.mutate(
                      { timelineId: item.id },
                      {
                        onSuccess: () => toast.success('状态已删除'),
                        onError: (error) =>
                          toast.error(error instanceof Error ? error.message : '删除失败'),
                      },
                    )
                  }
                  variant="destructive"
                >
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {!canDelete && <ReportButton id={item.id} type={16} />}
      </div>

      {showReplies && (
        <div className="border-border/70 flex flex-col gap-3 border-t pt-3">
          <CommentBox
            comments={repliesQuery.data}
            emptyText="还没有回复。"
            error={repliesQuery.isError}
            framed={false}
            itemVariant="inline"
            listClassName="gap-1"
            reactionTarget={replyTarget}
            showReplyEntry={false}
            title={null}
            userAvatarViewTransition={false}
            virtual={false}
          />
          <TimelineInlineReplyComposer target={replyTarget} />
        </div>
      )}
    </div>
  )
}

function TimelineInlineReplyComposer({ target }: { target: ReplyTarget }) {
  const [draft, setDraft] = useState('')
  const session = useSession()
  const openLoginDialog = useSetAtom(loginDialogAtom)
  const mutation = useCreateReplyMutation()
  const normalizedDraft = draft.trim()

  const submit = async () => {
    if (session === undefined || mutation.isPending) return
    if (session === null) {
      openLoginDialog({ open: true })
      return
    }
    if (!normalizedDraft) {
      toast.error('回复内容不能为空')
      return
    }

    try {
      const turnstileToken = await client.getTurnstileToken({})
      await mutation.mutateAsync({
        content: markdownToBBCode(normalizedDraft),
        target,
        turnstileToken,
      })
      setDraft('')
      toast.success('回复已发送')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '回复失败')
    }
  }

  return (
    <div className="flex min-w-0 items-end gap-2">
      <Textarea
        aria-label="回复这条动态"
        className="max-h-32 min-h-9 flex-1 resize-none overflow-y-auto rounded-none border-x-0 border-t-0 bg-transparent px-0 py-2 shadow-none focus-visible:ring-0"
        disabled={mutation.isPending}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            void submit()
          }
        }}
        placeholder="写下回复…"
        value={draft}
      />
      <Button
        aria-label="发送回复"
        className="size-8 shrink-0"
        disabled={mutation.isPending || session === undefined || !normalizedDraft}
        onClick={submit}
        size="icon"
        title="发送回复（Ctrl+Enter）"
        type="button"
        variant="ghost"
      >
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
    </div>
  )
}
