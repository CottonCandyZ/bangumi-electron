import { type PropsWithChildren } from 'react'
import { client } from '@renderer/lib/client'
import './window-frame.css'

const platform = await client.platform({})

export function WindowFrame({ children }: PropsWithChildren) {
  return (
    <div className={platform === 'win32' ? 'windows-frame' : undefined}>
      {platform === 'win32' && <div className="window-titlebar drag-region" />}
      {children}
    </div>
  )
}
