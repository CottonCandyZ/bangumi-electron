import { t } from './_init'
import { hideReplyWindow } from '../reply-window'
import {
  openReplyWindow,
  getReplyWindowContent,
  updateReplyWindowDraft,
  dockReplyWindow,
  finishReplyWindow,
  focusReplyWindow,
} from '../reply-window'
import type { ReplyComposerContent } from '../../shared/reply'

export const replyWindowIPC = {
  hideReplyWindow: t.procedure.input().action(async () => hideReplyWindow()),
  openReplyWindow: t.procedure
    .input<ReplyComposerContent>()
    .action(async ({ input }) => openReplyWindow(input)),
  getReplyWindowContent: t.procedure.input().action(async () => getReplyWindowContent()),
  updateReplyWindowDraft: t.procedure
    .input<{ draft: string }>()
    .action(async ({ input }) => updateReplyWindowDraft(input.draft)),
  dockReplyWindow: t.procedure
    .input<ReplyComposerContent>()
    .action(async ({ input }) => dockReplyWindow(input)),
  finishReplyWindow: t.procedure.input().action(async () => finishReplyWindow()),
  focusReplyWindow: t.procedure.input().action(async () => focusReplyWindow()),
}
