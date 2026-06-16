import { MyLink } from '@renderer/components/my-link'
import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  useCreateGroupTopicMutation,
  useGroupByNameQuery,
} from '@renderer/data/hooks/api/community'
import { useSession } from '@renderer/data/hooks/session'
import { client } from '@renderer/lib/client'
import { markdownToBBCode } from '@renderer/lib/utils/markdown-bbcode'
import { MarkdownReplyEditor } from '@renderer/modules/reply-composer/markdown-reply-editor'
import { ReplyPreview } from '@renderer/modules/reply-composer/reply-preview'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { useSetAtom } from 'jotai'
import { Loader2, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function CreateGroupTopicPage({ groupName }: { groupName: string | undefined }) {
  const navigate = useNavigate()
  const session = useSession()
  const openLoginDialog = useSetAtom(loginDialogAtom)
  const groupQuery = useGroupByNameQuery({ groupName, enabled: !!groupName })
  const createMutation = useCreateGroupTopicMutation()
  const [title, setTitle] = useState('')
  const [draft, setDraft] = useState('')
  const bbcode = useMemo(() => markdownToBBCode(draft), [draft])
  const submitting = createMutation.isPending

  usePageScrollRestoreReady(!groupQuery.isLoading || groupQuery.isError)

  const submit = async () => {
    if (session === undefined) return

    if (session === null) {
      openLoginDialog({ open: true })
      return
    }

    if (!title.trim()) {
      toast.error('标题不能为空')
      return
    }

    if (!bbcode.trim()) {
      toast.error('内容不能为空')
      return
    }

    try {
      const turnstileToken = await client.getTurnstileToken({})
      const result = await createMutation.mutateAsync({
        content: bbcode,
        groupName,
        title: title.trim(),
        turnstileToken,
      })
      toast.success('话题已发布')
      navigate(`/group/topic/${result.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '发布失败')
    }
  }

  if (!groupName) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="text-muted-foreground text-sm">没有找到小组。</p>
      </div>
    )
  }

  const groupTitle = groupQuery.data?.title || groupQuery.data?.name || groupName

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col gap-5 px-10 py-8">
      <header className="flex shrink-0 flex-col gap-3">
        <div className="flex flex-row flex-wrap items-center gap-2">
          <MyLink to={`/group/${encodeURIComponent(groupName)}`}>
            <Badge
              variant="outline"
              className="hover:bg-primary/10 hover:text-primary cursor-pointer gap-1.5 shadow-none transition-colors"
            >
              小组 · {groupTitle}
            </Badge>
          </MyLink>
        </div>
        <h1 className="text-3xl leading-tight font-semibold">创建话题</h1>
      </header>

      <section className="flex shrink-0 flex-col gap-2">
        <label className="text-muted-foreground text-xs font-medium" htmlFor="group-topic-title">
          标题
        </label>
        <Input
          disabled={submitting}
          id="group-topic-title"
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 @4xl:grid-cols-2">
        <section className="flex min-h-0 flex-col gap-2">
          <h2 className="text-muted-foreground shrink-0 text-xs font-medium">预览</h2>
          <ReplyPreview className="min-h-0 flex-1" value={draft} />
        </section>
        <section className="flex min-h-0 flex-col gap-2">
          <h2 className="text-muted-foreground shrink-0 text-xs font-medium">编辑</h2>
          <MarkdownReplyEditor
            className="min-h-0 flex-1"
            disabled={submitting}
            onChange={setDraft}
            value={draft}
          />
        </section>
      </div>

      <footer className="flex shrink-0 flex-row justify-end gap-2 border-t pt-4">
        <Button
          disabled={submitting}
          onClick={() => navigate(`/group/${encodeURIComponent(groupName)}`)}
          variant="outline"
        >
          取消
        </Button>
        <Button disabled={submitting || session === undefined} onClick={submit}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          发布
        </Button>
      </footer>
    </div>
  )
}
