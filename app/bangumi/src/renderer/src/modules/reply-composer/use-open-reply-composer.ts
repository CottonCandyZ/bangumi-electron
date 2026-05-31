import { openReplyComposerAtomAction } from '@renderer/state/panel'
import type { ReplyComposerContent } from '@shared/reply'
import { useSetAtom } from 'jotai'
import { useCallback } from 'react'

export function useOpenReplyComposer() {
  const openReplyComposer = useSetAtom(openReplyComposerAtomAction)

  return useCallback(
    (content: ReplyComposerContent) => {
      openReplyComposer(content)
    },
    [openReplyComposer],
  )
}
