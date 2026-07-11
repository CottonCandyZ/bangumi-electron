import { Button } from '@renderer/components/ui/button'
import { Textarea } from '@renderer/components/ui/textarea'
import { useCreateTimelineMutation } from '@renderer/data/hooks/api/timeline'
import { useSession } from '@renderer/data/hooks/session'
import { client } from '@renderer/lib/client'
import { cn } from '@renderer/lib/utils'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { useSetAtom } from 'jotai'
import { Loader2, Plus, Send } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useId, useState } from 'react'
import { toast } from 'sonner'

const STATUS_MAX_LENGTH = 380
const EXPAND_EASE = [0.22, 1, 0.36, 1] as const
const COLLAPSE_EASE = [0.4, 0, 1, 1] as const

export function TimelineComposer() {
  const [content, setContent] = useState('')
  const [open, setOpen] = useState(false)
  const session = useSession()
  const openLoginDialog = useSetAtom(loginDialogAtom)
  const mutation = useCreateTimelineMutation()
  const normalizedContent = content.trim()
  const contentTooLong = content.length > STATUS_MAX_LENGTH
  const composerId = useId()
  const reducedMotion = useReducedMotion()

  const openComposer = () => {
    if (session === null) {
      openLoginDialog({ open: true, content: { onSuccess: () => setOpen(true) } })
      return
    }
    setOpen(true)
  }

  const closeComposer = () => {
    if (!mutation.isPending) setOpen(false)
  }

  const submit = async () => {
    if (session === undefined || mutation.isPending) return
    if (session === null) {
      openLoginDialog({ open: true, content: { onSuccess: () => setOpen(true) } })
      return
    }
    if (!normalizedContent) {
      toast.error('状态内容不能为空')
      return
    }
    if (contentTooLong) {
      toast.error(`状态内容不能超过 ${STATUS_MAX_LENGTH} 字`)
      return
    }

    try {
      const turnstileToken = await client.getTurnstileToken({})
      await mutation.mutateAsync({ content: normalizedContent, turnstileToken })
      setContent('')
      setOpen(false)
      toast.success('状态已发布')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '发布失败')
    }
  }

  return (
    <section aria-label="发布动态" className="shrink-0" data-timeline-composer>
      <div className="relative w-fit">
        <Button
          aria-controls={`${composerId}-panel`}
          aria-expanded={open}
          aria-label={open ? '收起动态编辑器' : content.trim() ? '继续编辑动态' : '发布动态'}
          className="text-muted-foreground hover:text-foreground size-8 shadow-none"
          disabled={session === undefined || mutation.isPending}
          onClick={open ? closeComposer : openComposer}
          size="icon"
          title={open ? '收起' : content.trim() ? '继续编辑动态' : '发布动态'}
          type="button"
          variant="ghost"
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.2, ease: EXPAND_EASE }}
          >
            <Plus className="size-4" />
          </motion.span>
        </Button>
        {content.trim() && !open && (
          <span className="bg-primary pointer-events-none absolute top-1 right-1 size-1.5 rounded-full" />
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            animate="open"
            className="overflow-hidden"
            exit="closed"
            id={`${composerId}-panel`}
            initial="closed"
            variants={{
              closed: {
                height: 0,
                opacity: 0,
                transition: reducedMotion
                  ? { duration: 0 }
                  : {
                      height: { duration: 0.2, ease: COLLAPSE_EASE },
                      opacity: { duration: 0.12 },
                    },
              },
              open: {
                height: 'auto',
                opacity: 1,
                transition: reducedMotion
                  ? { duration: 0 }
                  : {
                      height: { duration: 0.28, ease: EXPAND_EASE },
                      opacity: { delay: 0.04, duration: 0.18 },
                    },
              },
            }}
          >
            <motion.div
              animate={{ y: 0 }}
              className="border-primary/20 ml-2 flex flex-col gap-2 border-l-2 px-3 pt-1 pb-3"
              exit={{ y: reducedMotion ? 0 : -6 }}
              initial={{ y: reducedMotion ? 0 : -8 }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.24, ease: EXPAND_EASE }}
            >
              <Textarea
                aria-describedby={`${composerId}-count`}
                aria-invalid={contentTooLong}
                aria-label="动态内容"
                autoFocus
                className="placeholder:text-muted-foreground/70 max-h-52 min-h-24 resize-none overflow-x-hidden overflow-y-auto rounded-none border-x-0 border-t-0 bg-transparent px-0 py-2 shadow-none focus-visible:ring-0"
                disabled={mutation.isPending}
                onChange={(event) => setContent(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') closeComposer()
                }}
                placeholder="分享此刻的想法…"
                value={content}
              />
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    'text-muted-foreground text-xs tabular-nums transition-colors',
                    contentTooLong && 'text-destructive font-medium',
                  )}
                  id={`${composerId}-count`}
                >
                  {content.length}/{STATUS_MAX_LENGTH}
                </span>
                <Button
                  className="h-8 gap-1.5"
                  disabled={
                    mutation.isPending ||
                    session === undefined ||
                    !normalizedContent ||
                    contentTooLong
                  }
                  onClick={submit}
                  size="sm"
                  type="button"
                >
                  {mutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  发布
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
