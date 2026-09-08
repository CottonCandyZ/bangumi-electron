import { openReplyComposerAtomAction } from '@renderer/state/panel'
import type { ReplyComposerContent } from '@shared/reply'
import { useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { client } from '@renderer/lib/client'
import { toast } from 'sonner'

export function useOpenReplyComposer() {
  const openReplyComposer = useSetAtom(openReplyComposerAtomAction)

  return useCallback(
    (content: ReplyComposerContent) => {
      void client
        .focusReplyWindow({})
        .then((focused) => {
          if (focused) toast.info('已打开现有草稿，可收回侧边栏后继续')
          else openReplyComposer(content)
        })
        .catch(() => openReplyComposer(content))
    },
    [openReplyComposer],
  )
}
