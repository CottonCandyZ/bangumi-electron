import { type PropsWithChildren } from 'react'
import { client } from '@renderer/lib/client'
import { NavButton } from './nav-button'
import './window-frame.css'

const platform = await client.platform({})

export function WindowFrame({ children }: PropsWithChildren) {
  return (
    <div className={platform === 'win32' ? 'windows-frame' : undefined}>
      {platform === 'win32' && (
        <div className="window-titlebar drag-region flex items-center pl-2">
          <NavButton compact />
        </div>
      )}
      {children}
    </div>
  )
}
