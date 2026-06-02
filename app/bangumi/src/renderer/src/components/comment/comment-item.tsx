import { BBCodeImagePreviewProvider } from '@renderer/components/comment/bbcode-image'
import { CommentDeleteButton } from '@renderer/components/comment/comment-delete-button'
import { CommentEditButton } from '@renderer/components/comment/comment-edit-button'
import {
  CommentReactionButton,
  CommentReactions,
} from '@renderer/components/comment/comment-reactions'
import { CommentReplyButton } from '@renderer/components/comment/comment-reply-button'
import {
  CommentUserAvatarLink,
  CommentUserSignature,
  CommentUserUsername,
  UserProfileLink,
} from '@renderer/components/comment/comment-user'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { canReact, type ReactionTarget } from '@renderer/data/fetch/api/reaction'
import { canDeleteReply, canEditReply } from '@renderer/data/fetch/api/reply'
import { useSession } from '@renderer/data/hooks/session'
import type { Comment, CommentBase } from '@renderer/data/types/comment'
import { cn } from '@renderer/lib/utils'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import { replyComposerAtom } from '@renderer/state/panel'
import type { ReplyComposerContent, ReplyTarget } from '@shared/reply'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useMemo, useState } from 'react'

const DEFAULT_VISIBLE_REPLY_COUNT = 3

export function hasVisibleReplyContent(reply: CommentBase) {
  return reply.content.trim().length > 0
}

export function CommentItem({
  comment,
  floorNumber,
  reactionTarget,
  userAvatarViewTransition,
  replyTarget,
}: {
  comment: Comment
  floorNumber: number
  reactionTarget?: ReactionTarget
  replyTarget?: ReplyTarget
  userAvatarViewTransition: boolean
}) {
  const [showAllReplies, setShowAllReplies] = useState(false)
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false)
  const replyComposer = useAtomValue(replyComposerAtom)
  const allVisibleReplies = useMemo(
    () =>
      comment.replies
        .map((reply, index) => ({
          floorLabel: `#${floorNumber}-${index + 1}`,
          reply,
        }))
        .filter(({ reply }) => hasVisibleReplyContent(reply)),
    [comment.replies, floorNumber],
  )
  const replyCount = allVisibleReplies.length
  const hasHiddenReplies = replyCount > DEFAULT_VISIBLE_REPLY_COUNT
  const visibleReplies =
    hasHiddenReplies && !showAllReplies
      ? allVisibleReplies.slice(0, DEFAULT_VISIBLE_REPLY_COUNT)
      : allVisibleReplies
  const hiddenReplyCount = replyCount - DEFAULT_VISIBLE_REPLY_COUNT
  const repliesId = `comment-${comment.id}-replies`
  const hasContent = comment.content.trim().length > 0
  const session = useSession()
  const showDelete =
    !!replyTarget && canDeleteReply(replyTarget) && session?.id === comment.creatorID
  const showEdit =
    !!replyTarget &&
    canEditReply(replyTarget) &&
    session?.id === comment.creatorID &&
    comment.replies.length === 0
  const showReaction = canReact(reactionTarget)
  const highlightedReplyId = getHighlightedReplyId(replyComposer, replyTarget)
  const highlighted = highlightedReplyId === comment.id

  return (
    <Card
      className={cn(
        'group/comment relative flex flex-row gap-3 p-3 shadow-none',
        highlighted && 'border-primary/70 bg-primary/5',
        replyTarget
          ? showDelete || showEdit
            ? 'pr-52'
            : 'pr-32'
          : showReaction
            ? 'pr-20'
            : 'pr-12',
      )}
      data-comment-id={comment.id}
    >
      <div className="absolute top-3 right-3 flex flex-row items-center gap-1.5">
        <div
          className={cn(
            'pointer-events-none flex flex-row items-center gap-1.5 opacity-0 transition-opacity group-focus-within/comment:pointer-events-auto group-focus-within/comment:opacity-100 group-hover/comment:pointer-events-auto group-hover/comment:opacity-100',
            reactionPickerOpen && 'pointer-events-auto opacity-100',
          )}
        >
          <CommentReactionButton
            className="h-6 px-1.5"
            comment={comment}
            onOpenChange={setReactionPickerOpen}
            target={reactionTarget}
          />
          {replyTarget && (
            <>
              <CommentReplyButton
                className="h-6 px-1.5"
                comment={comment}
                floorLabel={`#${floorNumber}`}
                target={replyTarget}
              />
              {showEdit && (
                <CommentEditButton className="h-6 px-1.5" comment={comment} target={replyTarget} />
              )}
              <CommentDeleteButton className="h-6 px-1.5" comment={comment} target={replyTarget} />
            </>
          )}
        </div>
        <span className="text-muted-foreground text-xs tabular-nums">#{floorNumber}</span>
      </div>
      {comment.user?.avatar.medium ? (
        <CommentUserAvatarLink
          className="size-10 shrink-0"
          imageClassName="size-10 overflow-hidden rounded-full"
          transitionKey={`comment-${comment.id}`}
          user={comment.user}
          viewTransition={userAvatarViewTransition}
        />
      ) : (
        <div className="bg-muted size-10 shrink-0 rounded-full" />
      )}
      <BBCodeImagePreviewProvider>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <CommentHeader comment={comment} />
          {hasContent && (
            <div className="bbcode text-sm whitespace-pre-line">
              {renderBBCode(comment.content)}
            </div>
          )}
          <CommentReactions comment={comment} target={reactionTarget} />
          {replyCount > 0 && (
            <div
              className="border-border/60 bg-muted/25 divide-border flex flex-col divide-y rounded-md border px-2"
              id={repliesId}
            >
              {visibleReplies.map(({ floorLabel, reply }) => (
                <ReplyItem
                  reply={reply}
                  key={reply.id}
                  floorLabel={floorLabel}
                  highlighted={highlightedReplyId === reply.id}
                  reactionTarget={reactionTarget}
                  replyTarget={replyTarget}
                  userAvatarViewTransition={userAvatarViewTransition}
                />
              ))}
            </div>
          )}
          {hasHiddenReplies && (
            <Button
              aria-controls={repliesId}
              aria-expanded={showAllReplies}
              className="text-muted-foreground hover:text-foreground -ml-2 h-7 w-fit px-2 text-xs"
              onClick={() => setShowAllReplies((value) => !value)}
              size="sm"
              type="button"
              variant="ghost"
            >
              {showAllReplies ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
              {showAllReplies ? '收起回复' : `展开剩余 ${hiddenReplyCount} 条回复`}
            </Button>
          )}
        </div>
      </BBCodeImagePreviewProvider>
    </Card>
  )
}

function CommentHeader({ comment }: { comment: Comment }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="flex min-w-0 flex-row flex-wrap items-center gap-x-2 gap-y-1">
        {comment.user ? (
          <>
            <UserProfileLink
              className="hover:text-primary font-medium transition-colors"
              user={comment.user}
            >
              {comment.user.nickname}
            </UserProfileLink>
            <CommentUserSignature sign={comment.user.sign} />
          </>
        ) : (
          <span className="font-medium">#{comment.creatorID}</span>
        )}
        <span className="text-muted-foreground text-xs">
          <time
            dateTime={dayjs.unix(comment.createdAt).toISOString()}
            title={dayjs.unix(comment.createdAt).format('YYYY-MM-DD HH:mm')}
          >
            {formatRecentUnixTime(comment.createdAt)}
          </time>
        </span>
      </div>
      {comment.user ? <CommentUserUsername username={comment.user.username} /> : null}
    </div>
  )
}

function ReplyItem({
  floorLabel,
  highlighted,
  reactionTarget,
  reply,
  replyTarget,
  userAvatarViewTransition,
}: {
  floorLabel: string
  highlighted: boolean
  reactionTarget?: ReactionTarget
  reply: CommentBase
  replyTarget?: ReplyTarget
  userAvatarViewTransition: boolean
}) {
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false)
  const session = useSession()
  const showEdit = !!replyTarget && canEditReply(replyTarget) && session?.id === reply.creatorID

  return (
    <div
      className={cn(
        'group/reply -mx-1 flex flex-row gap-2 rounded-md px-1 py-2.5 text-sm first:pt-2 last:pb-2',
        highlighted && 'bg-primary/10 ring-primary/25 ring-1',
      )}
      data-reply-id={reply.id}
    >
      {reply.user?.avatar.medium ? (
        <CommentUserAvatarLink
          className="mt-0.5 size-7 shrink-0"
          imageClassName="size-7 overflow-hidden rounded-full"
          transitionKey={`reply-${reply.id}`}
          user={reply.user}
          viewTransition={userAvatarViewTransition}
        />
      ) : (
        <div className="bg-muted mt-0.5 size-7 shrink-0 rounded-full" />
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 flex-row flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {reply.user ? (
              <>
                <UserProfileLink
                  className="hover:text-primary font-medium transition-colors"
                  user={reply.user}
                >
                  {reply.user.nickname}
                </UserProfileLink>
                <CommentUserSignature sign={reply.user.sign} />
              </>
            ) : (
              <span className="font-medium">#{reply.creatorID}</span>
            )}
            <span className="text-muted-foreground text-xs">
              <time
                dateTime={dayjs.unix(reply.createdAt).toISOString()}
                title={dayjs.unix(reply.createdAt).format('YYYY-MM-DD HH:mm')}
              >
                {formatRecentUnixTime(reply.createdAt)}
              </time>
            </span>
          </div>
          {reply.user ? <CommentUserUsername username={reply.user.username} /> : null}
        </div>
        <div className="bbcode whitespace-pre-line">{renderBBCode(reply.content)}</div>
        <CommentReactions comment={reply} compact target={reactionTarget} />
      </div>
      <div className="flex h-6 shrink-0 flex-row items-center gap-1.5">
        {replyTarget && (
          <div
            className={cn(
              'pointer-events-none flex h-6 flex-row items-center gap-1 opacity-0 transition-opacity group-focus-within/reply:pointer-events-auto group-focus-within/reply:opacity-100 group-hover/reply:pointer-events-auto group-hover/reply:opacity-100',
              reactionPickerOpen && 'pointer-events-auto opacity-100',
            )}
          >
            <CommentReactionButton
              className="h-6 px-1.5"
              comment={reply}
              onOpenChange={setReactionPickerOpen}
              target={reactionTarget}
            />
            <CommentReplyButton
              className="h-6 px-1.5"
              comment={reply}
              floorLabel={floorLabel}
              target={replyTarget}
            />
            {showEdit && (
              <CommentEditButton className="h-6 px-1.5" comment={reply} target={replyTarget} />
            )}
            <CommentDeleteButton className="h-6 px-1.5" comment={reply} target={replyTarget} />
          </div>
        )}
        <span className="text-muted-foreground text-xs leading-none tabular-nums">
          {floorLabel}
        </span>
      </div>
    </div>
  )
}

function getHighlightedReplyId(
  replyComposer: { content: ReplyComposerContent | null; open: boolean },
  replyTarget?: ReplyTarget,
) {
  const content = replyComposer.open ? replyComposer.content : undefined
  if (!content?.replyTo || !content.replyToFloor || !replyTarget) return null
  if (content.target.type !== replyTarget.type) return null
  if (String(content.target.id) !== String(replyTarget.id)) return null
  return content.replyTo
}
