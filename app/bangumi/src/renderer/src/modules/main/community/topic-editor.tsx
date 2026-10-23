import { MyLink } from '@renderer/components/my-link'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { useSession } from '@renderer/data/hooks/session'
import { markdownToBBCode } from '@renderer/lib/utils/markdown-bbcode'
import { MarkdownReplyEditor } from '@renderer/modules/reply-composer/markdown-reply-editor'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { useSetAtom } from 'jotai'
import { Loader2, Save, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

export function TopicEditor({
  action,
  initialDraft = '',
  initialTitle = '',
  onCancel,
  onSubmit,
  sourceLabel,
  sourceTitle,
  sourceTo,
}: {
  action: 'create' | 'edit'
  initialDraft?: string
  initialTitle?: string
  onCancel: () => void
  onSubmit: (input: { content: string; title: string }) => Promise<void>
  sourceLabel: string
  sourceTitle: string
  sourceTo: string
}) {
  const session = useSession()
  const openLoginDialog = useSetAtom(loginDialogAtom)
  const [title, setTitle] = useState(initialTitle)
  const [draft, setDraft] = useState(initialDraft)
  const [submitting, setSubmitting] = useState(false)
  const bbcode = useMemo(() => markdownToBBCode(draft), [draft])

  const submit = async () => {
    if (session === undefined || submitting) return
    if (session === null) {
      openLoginDialog({ open: true })
      return
    }
    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      toast.error('标题不能为空')
      return
    }
    if (!bbcode.trim()) {
      toast.error('内容不能为空')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({ content: bbcode, title: normalizedTitle })
      toast.success(action === 'create' ? '话题已发布' : '话题已保存')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : action === 'create' ? '发布失败' : '保存失败',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="mx-auto flex h-full min-h-0 max-w-5xl flex-col gap-5 px-10 py-8"
      onKeyDown={(event) => {
        if (
          event.key === 'Enter' &&
          (event.ctrlKey || event.metaKey) &&
          !event.nativeEvent.isComposing
        ) {
          event.preventDefault()
          void submit()
        }
      }}
    >
      <header className="flex shrink-0 flex-col gap-3">
        <MyLink className="w-fit" to={sourceTo}>
          <Badge
            className="hover:bg-primary/10 hover:text-primary cursor-pointer gap-1.5 shadow-none transition-colors"
            variant="outline"
          >
            {sourceLabel} · {sourceTitle}
          </Badge>
        </MyLink>
        <h1 className="text-3xl leading-tight font-semibold">
          {action === 'create' ? '创建话题' : '编辑话题'}
        </h1>
      </header>

      <section className="flex shrink-0 flex-col gap-2">
        <label className="text-muted-foreground text-xs font-medium" htmlFor="topic-title">
          标题
        </label>
        <Input
          disabled={submitting}
          id="topic-title"
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </section>

      <section className="flex min-h-0 flex-1 flex-col gap-2">
        <h2 className="text-muted-foreground shrink-0 text-xs font-medium">内容</h2>
        <MarkdownReplyEditor
          className="bg-background min-h-0 flex-1 rounded-xl border"
          disabled={submitting}
          value={draft}
          onChange={setDraft}
          footerEnd={
            <>
              <Button
                className="h-7 px-3 text-xs"
                disabled={submitting}
                onClick={onCancel}
                size="sm"
                variant="ghost"
              >
                取消
              </Button>
              <Button
                className="h-7 gap-1.5 px-3 text-xs"
                disabled={submitting || session === undefined}
                onClick={() => void submit()}
                size="sm"
                title="Ctrl / ⌘ + Enter"
              >
                {submitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : action === 'create' ? (
                  <Send className="size-3.5" />
                ) : (
                  <Save className="size-3.5" />
                )}
                {action === 'create' ? '发布' : '保存'}
              </Button>
            </>
          }
        />
      </section>
    </div>
  )
}
