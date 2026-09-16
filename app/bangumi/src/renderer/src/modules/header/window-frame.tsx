import { type CSSProperties, type PropsWithChildren } from 'react'
import { client } from '@renderer/lib/client'
import './window-frame.css'
import { UI_CONFIG } from '@renderer/config'

const platform = await client.platform({})

export function WindowFrame({ children }: PropsWithChildren) {
  return (
    <div
      className={platform === 'win32' ? 'windows-frame' : undefined}
      style={{ '--app-header-height': `${UI_CONFIG.HEADER_HEIGHT}px` } as CSSProperties}
    >
      {platform === 'win32' && <div className="window-titlebar drag-region" />}
      {children}
    </div>
  )
}
