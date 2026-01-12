import { useLayoutEffect } from 'react'
import { client } from '@renderer/lib/client'

export function Component() {
  useLayoutEffect(() => {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    client.commandOverlayReady({})
  }, [])

  return <div className="h-dvh w-dvw bg-transparent" />
}
