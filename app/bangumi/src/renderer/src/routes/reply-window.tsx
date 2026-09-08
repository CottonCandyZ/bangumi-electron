import { useEffect, useState } from 'react'
import { client } from '@renderer/lib/client'
import { store } from '@renderer/state/utils'
import { replyComposerAtom } from '@renderer/state/panel'
import { ReplyComposer } from '@renderer/modules/reply-composer/reply-composer'

export function Component() {
  const [error, setError] = useState('')
  useEffect(() => {
    void client
      .getReplyWindowContent({})
      .then((content) => {
        if (content) store.set(replyComposerAtom, { open: true, content })
      })
      .catch((error) => setError(String(error)))
  }, [])
  return <div className="h-dvh overflow-hidden">{error || <ReplyComposer detached />}</div>
}
