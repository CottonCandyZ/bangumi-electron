import { Button } from '@renderer/components/ui/button'
import { useCreateReplyMutation, useUpdateReplyMutation } from '@renderer/data/hooks/api/reply'
import { client } from '@renderer/lib/client'
import { cn } from '@renderer/lib/utils'
import { markdownToBBCode } from '@renderer/lib/utils/markdown-bbcode'
import { MarkdownReplyEditor } from '@renderer/modules/reply-composer/markdown-reply-editor'
import { mainContainerRight } from '@renderer/state/main-bounding-box'
import { closeReplyComposerAtomAction, replyComposerAtom } from '@renderer/state/panel'
import { getReplyTargetLabel } from '@shared/reply'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  PictureInPicture2,
  Save,
  Send,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

/**
 * 回复编辑器。
 * - 主窗口内：悬浮在主内容区右下角的卡片，可最小化，写的时候仍能浏览评论区；
 * - detached：独立回复窗口，铺满整个窗口。
 */
export function ReplyComposer({ detached = false }: { detached?: boolean }) {
  const state = useAtomValue(replyComposerAtom)
  const closeReplyComposer = useSetAtom(closeReplyComposerAtomAction)
  const mainRight = useAtomValue(mainContainerRight)
  const [draft, setDraft] = useState('')
  const [minimized, setMinimized] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [sending, setSending] = useState(false)
  const createMutation = useCreateReplyMutation()
  const updateMutation = useUpdateReplyMutation()
  const content = state.content
  const isEditing = content?.editCommentId !== undefined
  const submitting = createMutation.isPending || updateMutation.isPending || transferring || sending
  const bbcode = useMemo(() => markdownToBBCode(draft), [draft])
  const replyContext = content?.replyToName
    ? [content.replyToName, content.replyToFloor].filter(Boolean).join(' · ')
    : content
      ? getReplyTargetLabel(content.target)
      : ''

  useEffect(() => {
    if (!state.open) return
    setDraft(content?.draft ?? '')
    setMinimized(false)
  }, [content, state.open])

  const close = () => {
    if (submitting) return
    if (detached) {
      void client.hideReplyWindow({})
      return
    }
    closeReplyComposer()
  }

  const transfer = async () => {
    if (!content || submitting) return
    setTransferring(true)
    try {
      const next = { ...content, draft }
      if (detached) await client.dockReplyWindow(next)
      else if (await client.openReplyWindow(next)) closeReplyComposer()
      else toast.info('已有独立回复窗口，请先完成或收回该草稿')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '切换编辑器失败')
    } finally {
      setTransferring(false)
    }
  }

  const submit = async () => {
    if (!content || submitting) return
    if (!bbcode.trim()) {
      toast.error('回复内容不能为空')
      return
    }

    setSending(true)
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
      if (detached) await client.finishReplyWindow({})
      else closeReplyComposer()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isEditing ? '编辑失败' : '回复失败')
    } finally {
      setSending(false)
    }
  }

  if (!state.open || !content) return null

  const title = isEditing ? '编辑' : '回复'

  return (
    <section
      aria-labelledby="reply-composer-title"
      className={cn(
        'bg-background flex min-w-0 flex-col',
        detached
          ? 'h-full'
          : 'fixed right-6 bottom-6 z-40 w-[32rem] max-w-[calc(100vw-3rem)] overflow-hidden rounded-xl border shadow-2xl',
      )}
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
      role="dialog"
      style={
        detached
          ? undefined
          : {
              height: minimized ? undefined : 'min(26rem, calc(100vh - 8rem))',
              right: mainRight > 0 ? `calc(100vw - ${mainRight}px + 1.5rem)` : undefined,
            }
      }
    >
      <header
        className={cn(
          'flex shrink-0 flex-row items-center gap-2 px-3',
          detached ? 'drag-region h-12 border-b' : 'h-11',
          !detached && !minimized && 'border-b',
        )}
      >
        <button
          type="button"
          className="no-drag-region flex min-w-0 flex-1 flex-row items-baseline gap-2 text-left"
          disabled={detached}
          onClick={() => setMinimized((value) => !value)}
        >
          <h2 id="reply-composer-title" className="shrink-0 text-sm font-semibold">
            {title}
          </h2>
          <span className="text-muted-foreground truncate text-xs">{replyContext}</span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          {!detached && (
            <HeaderIconButton
              label={minimized ? '展开' : '最小化'}
              onClick={() => setMinimized((value) => !value)}
            >
              {minimized ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </HeaderIconButton>
          )}
          <HeaderIconButton
            disabled={submitting}
            label={detached ? '收回到主窗口' : '弹出独立窗口'}
            onClick={() => void transfer()}
          >
            {detached ? (
              <PictureInPicture2 className="size-4" />
            ) : (
              <ExternalLink className="size-4" />
            )}
          </HeaderIconButton>
          <HeaderIconButton
            disabled={submitting}
            label={isEditing ? '关闭编辑' : '关闭回复'}
            onClick={close}
          >
            <X className="size-4" />
          </HeaderIconButton>
        </div>
      </header>
      {!minimized && (
        <MarkdownReplyEditor
          className="min-h-0 flex-1"
          disabled={submitting}
          value={draft}
          onChange={(value) => {
            setDraft(value)
            if (detached)
              void client.updateReplyWindowDraft({ draft: value }).catch(() => {
                toast.error('草稿暂存失败，请先收回到主窗口')
              })
          }}
          footerEnd={
            <Button
              className="h-7 gap-1.5 px-3 text-xs"
              disabled={submitting}
              onClick={() => void submit()}
              title="Ctrl / ⌘ + Enter"
              size="sm"
            >
              {submitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : isEditing ? (
                <Save className="size-3.5" />
              ) : (
                <Send className="size-3.5" />
              )}
              {isEditing ? '保存' : '发送'}
            </Button>
          }
        />
      )}
    </section>
  )
}

function HeaderIconButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Button
      aria-label={label}
      className="no-drag-region text-muted-foreground hover:text-foreground size-7"
      disabled={disabled}
      onClick={onClick}
      size="icon"
      title={label}
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  )
}
