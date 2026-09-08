import type { AppUpdateState } from '@shared/update'
import type { ReplyComposerContent, ReplyTarget } from '@shared/reply'

export type RendererHandlers = {
  dockReplyComposer: (content: ReplyComposerContent) => void
  replySubmitted: (target: ReplyTarget) => void
  isMaximize: (maximize: boolean) => void
  openCommandPanel: (payload?: { mode?: 'palette' | 'subject-search' }) => void
  navigateTo: (payload: { path: string }) => void
  updateState: (payload: AppUpdateState) => void
}
