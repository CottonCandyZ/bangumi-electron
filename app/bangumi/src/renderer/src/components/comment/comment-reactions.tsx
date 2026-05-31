import {
  BangumiSmile,
  REACTION_VALUE_TO_BANGUMI_SMILE,
} from '@renderer/components/comment/bangumi-smile'
import { Button } from '@renderer/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import {
  canReact,
  getAvailableReactionValues,
  type ReactionTarget,
} from '@renderer/data/fetch/api/reaction'
import { useToggleReactionMutation } from '@renderer/data/hooks/api/reaction'
import { useSession } from '@renderer/data/hooks/session'
import type { CommentReaction } from '@renderer/data/types/comment'
import { cn } from '@renderer/lib/utils'
import { SmilePlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

type CommentReactionsProps = {
  comment: ReactionItem
  compact?: boolean
  target?: ReactionTarget
}

export type ReactionItem = {
  id: number
  reactions?: CommentReaction[]
}

export function CommentReactions({ comment, compact = false, target }: CommentReactionsProps) {
  const visibleReactions = useMemo(
    () => comment.reactions?.filter((reaction) => reaction.users.length > 0) ?? [],
    [comment.reactions],
  )

  if (visibleReactions.length === 0) return null

  return (
    <div className={cn('flex flex-row flex-wrap gap-1.5', compact ? 'mt-1' : 'mt-0.5')}>
      {visibleReactions.map((reaction) => (
        <CommentReactionChip
          comment={comment}
          key={reaction.value}
          reaction={reaction}
          target={target}
        />
      ))}
    </div>
  )
}

export function CommentReactionButton({
  className,
  comment,
  target,
}: {
  className?: string
  comment: ReactionItem
  target?: ReactionTarget
}) {
  const [open, setOpen] = useState(false)
  const session = useSession()
  const mutation = useToggleReactionMutation()
  const values = getAvailableReactionValues(target)
  const currentValue = useMemo(
    () => comment.reactions?.find((reaction) => hasCurrentUser(reaction, session))?.value,
    [comment.reactions, session],
  )

  if (!canReact(target) || values.length === 0) return null

  const toggle = (value: number) => {
    if (!target) return

    mutation.mutate(
      {
        active: currentValue === value,
        commentId: comment.id,
        target,
        user: session
          ? { id: session.id, nickname: session.nickname, username: session.username }
          : undefined,
        value,
      },
      {
        onError: (error) => toast.error(error instanceof Error ? error.message : '贴贴失败'),
        onSuccess: () => setOpen(false),
      },
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="贴贴"
          className={cn(
            'text-muted-foreground hover:text-foreground h-6 px-1.5 text-xs select-none',
            open && 'bg-accent text-foreground hover:bg-accent hover:text-foreground',
            currentValue !== undefined && 'text-primary hover:text-primary',
            className,
          )}
          disabled={mutation.isPending}
          size="sm"
          title="贴贴"
          type="button"
          variant="ghost"
        >
          <SmilePlus className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2" collisionPadding={8} sideOffset={6}>
        <div className="grid grid-cols-6 gap-1">
          {values.map((value) => {
            const smileCode = REACTION_VALUE_TO_BANGUMI_SMILE[value]
            const active = currentValue === value

            return (
              <Button
                aria-label={active ? '取消贴贴' : '贴贴'}
                className={cn(
                  'size-8 rounded-md p-0 select-none',
                  active &&
                    'bg-primary/10 text-primary ring-primary/35 hover:bg-primary/15 focus-visible:ring-primary/45 ring-1',
                )}
                disabled={mutation.isPending}
                key={value}
                onClick={() => toggle(value)}
                size="icon"
                title={smileCode ?? value.toString()}
                type="button"
                variant="ghost"
              >
                {smileCode ? (
                  <BangumiSmile code={smileCode} variant="reaction" />
                ) : (
                  <span className="text-xs tabular-nums">{value}</span>
                )}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function CommentReactionChip({
  comment,
  reaction,
  target,
}: {
  comment: ReactionItem
  reaction: CommentReaction
  target?: ReactionTarget
}) {
  const session = useSession()
  const mutation = useToggleReactionMutation()
  const [userPopoverOpen, setUserPopoverOpen] = useState(false)
  const active = hasCurrentUser(reaction, session)
  const smileCode = REACTION_VALUE_TO_BANGUMI_SMILE[reaction.value]

  const toggle = () => {
    if (!target || !canReact(target)) return

    mutation.mutate(
      {
        active,
        commentId: comment.id,
        target,
        user: session
          ? { id: session.id, nickname: session.nickname, username: session.username }
          : undefined,
        value: reaction.value,
      },
      {
        onError: (error) => toast.error(error instanceof Error ? error.message : '贴贴失败'),
      },
    )
  }

  return (
    <Popover open={userPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'border-border/70 bg-muted/30 hover:bg-muted/60 inline-flex h-[25px] items-center gap-1 rounded-full border px-1.5 text-xs leading-none transition-colors select-none',
            userPopoverOpen && 'bg-muted/60 text-foreground',
            active &&
              'bg-primary/10 text-primary ring-primary/35 hover:bg-primary/15 border-transparent ring-1',
            !canReact(target) && 'cursor-default',
          )}
          disabled={mutation.isPending}
          onClick={toggle}
          onPointerEnter={() => setUserPopoverOpen(true)}
          onPointerLeave={() => setUserPopoverOpen(false)}
          type="button"
        >
          {smileCode ? (
            <BangumiSmile code={smileCode} variant="reaction" />
          ) : (
            <span className="text-muted-foreground tabular-nums">{reaction.value}</span>
          )}
          <span className={cn('text-muted-foreground tabular-nums', active && 'text-primary')}>
            {reaction.users.length}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="max-h-56 w-auto max-w-72 overflow-y-auto p-2 text-left text-xs leading-5 [text-wrap:wrap] break-words whitespace-normal"
        collisionPadding={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onPointerEnter={() => setUserPopoverOpen(true)}
        onPointerLeave={() => setUserPopoverOpen(false)}
        sideOffset={6}
      >
        {reaction.users.map((user, index) => (
          <span key={`${reaction.value}-${user.id}-${user.username}`}>
            {index > 0 ? '、' : null}
            {user.nickname || user.username}
          </span>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function hasCurrentUser(reaction: CommentReaction, session: ReturnType<typeof useSession>) {
  if (!session) return false

  return reaction.users.some((user) => user.id === session.id || user.username === session.username)
}
