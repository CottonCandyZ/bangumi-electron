import { Button } from '@renderer/components/ui/button'
import { useCreateReplyMutation, useUpdateReplyMutation } from '@renderer/data/hooks/api/reply'
import { client } from '@renderer/lib/client'
import { markdownToBBCode } from '@renderer/lib/utils/markdown-bbcode'
import { MarkdownReplyEditor } from '@renderer/modules/reply-composer/markdown-reply-editor'
import { ReplyPreview } from '@renderer/modules/reply-composer/reply-preview'
import { closeReplyComposerAtomAction, replyComposerAtom } from '@renderer/state/panel'
import { getReplyTargetLabel } from '@shared/reply'
import { useAtomValue, useSetAtom } from 'jotai'
import { Loader2, Save, Send, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export function ReplyComposer() {
  const state = useAtomValue(replyComposerAtom)
  const closeReplyComposer = useSetAtom(closeReplyComposerAtomAction)
  const [draft, setDraft] = useState('')
  const createMutation = useCreateReplyMutation()
  const updateMutation = useUpdateReplyMutation()
  const content = state.content
  const isEditing = content?.editCommentId !== undefined
  const submitting = createMutation.isPending || updateMutation.isPending
  const bbcode = useMemo(() => markdownToBBCode(draft), [draft])
  const replyContext = content?.replyToName
    ? ['回复', content.replyToName, content.replyToFloor].filter(Boolean).join(' · ')
    : content
      ? getReplyTargetLabel(content.target)
      : ''

  useEffect(() => {
    if (!state.open) return
    setDraft(content?.draft ?? '')
  }, [content?.draft, state.open])

  const close = () => {
    if (submitting) return
    closeReplyComposer()
  }

  const submit = async () => {
    if (!content) return
    if (!bbcode.trim()) {
      toast.error('回复内容不能为空')
      return
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          commentId: content.editCommentId!,
          content: bbcode,
          target: content.target,
        })
        toast.success('编辑已保存')
      } else {
        const turnstileToken = await client.getTurnstileToken({})
        await createMutation.mutateAsync({
          content: bbcode,
          replyTo: content.replyTo ?? 0,
          replyToHighlight: content.replyToHighlight,
          replyToRoot: content.replyToRoot,
          target: content.target,
          turnstileToken,
        })
        toast.success('回复已发送')
      }
      closeReplyComposer()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isEditing ? '编辑失败' : '回复失败')
    }
  }

  if (!state.open || !content) return null

  return (
    <aside
      aria-labelledby="reply-composer-title"
      className="bg-background flex h-full min-w-0 flex-col"
      role="complementary"
    >
      <header className="drag-region flex h-14 shrink-0 flex-row items-center justify-between gap-3 border-b px-3">
        <div className="min-w-0">
          <h2 id="reply-composer-title" className="text-foreground font-semibold">
            {isEditing ? '编辑' : '回复'}
          </h2>
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{replyContext}</p>
        </div>
        <Button
          aria-label={isEditing ? '关闭编辑' : '关闭回复'}
          className="no-drag-region -mr-1 size-8 shrink-0"
          disabled={submitting}
          onClick={close}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3">
        <section className="flex min-h-0 flex-[0.8] flex-col gap-2">
          <h3 className="text-muted-foreground shrink-0 text-xs font-medium">预览</h3>
          <ReplyPreview className="min-h-0 flex-1" value={draft} />
        </section>
        <section className="flex min-h-0 flex-[1.2] flex-col gap-2">
          <h3 className="text-muted-foreground shrink-0 text-xs font-medium">编辑</h3>
          <MarkdownReplyEditor
            className="min-h-0 flex-1"
            disabled={submitting}
            value={draft}
            onChange={setDraft}
          />
        </section>
      </div>
      <footer className="flex shrink-0 flex-row justify-end gap-2 border-t px-3 py-3">
        <Button variant="outline" onClick={close} disabled={submitting}>
          取消
        </Button>
        <Button onClick={submit} disabled={submitting}>
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isEditing ? (
            <Save className="size-4" />
          ) : (
            <Send className="size-4" />
          )}
          {isEditing ? '保存' : '发送'}
        </Button>
      </footer>
    </aside>
  )
}
