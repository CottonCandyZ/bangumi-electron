import { Button } from '@renderer/components/ui/button'
import { useOpenReplyComposer } from '@renderer/modules/reply-composer/use-open-reply-composer'
import { mainContainerLeft } from '@renderer/state/main-bounding-box'
import type { ReplyTarget } from '@shared/reply'
import { useAtomValue } from 'jotai'
import { MessageCircle } from 'lucide-react'

const COMMENT_FAB_CLASS_NAME =
  'fixed bottom-6 z-40 h-10 gap-2 rounded-md border-input/70 bg-background/70 px-4 text-foreground/80 shadow-sm backdrop-blur-sm hover:border-input hover:bg-background hover:text-foreground'

export function MainCommentFab({ replyTarget }: { replyTarget: ReplyTarget }) {
  const openReplyComposer = useOpenReplyComposer()
  const mainLeft = useAtomValue(mainContainerLeft)

  return (
    <Button
      className={COMMENT_FAB_CLASS_NAME}
      onClick={() => openReplyComposer({ target: replyTarget })}
      style={mainLeft > 0 ? { left: `${mainLeft + 24}px` } : { left: '1.5rem' }}
      type="button"
      variant="outline"
    >
      <MessageCircle className="size-4" />
      评论
    </Button>
  )
}
