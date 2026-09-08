import { Button } from '@renderer/components/ui/button'
import { useOpenReplyComposer } from '@renderer/modules/reply-composer/use-open-reply-composer'
import { mainContainerRight } from '@renderer/state/main-bounding-box'
import type { ReplyTarget } from '@shared/reply'
import { useAtomValue } from 'jotai'
import { MessageCircle } from 'lucide-react'

const COMMENT_FAB_CLASS_NAME =
  'no-drag-region fixed right-6 bottom-20 z-30 size-11 rounded-full bg-background p-0 text-primary opacity-50 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-background hover:opacity-100 focus-visible:opacity-100 active:scale-95'

export function MainCommentFab({ replyTarget }: { replyTarget: ReplyTarget }) {
  const openReplyComposer = useOpenReplyComposer()
  const mainRight = useAtomValue(mainContainerRight)

  return (
    <Button
      className={COMMENT_FAB_CLASS_NAME}
      aria-label="评论"
      title="评论"
      onClick={() => openReplyComposer({ target: replyTarget })}
      style={mainRight > 0 ? { right: `calc(100vw - ${mainRight}px + 1.5rem)` } : undefined}
      type="button"
      variant="ghost"
      size="icon"
    >
      <MessageCircle className="size-5" />
    </Button>
  )
}
