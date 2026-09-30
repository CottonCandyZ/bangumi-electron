import { type CSSProperties, type PropsWithChildren } from 'react'
import { client } from '@renderer/lib/client'
import './window-frame.css'
import { UI_CONFIG } from '@renderer/config'

const platform = await client.platform({})

/**
 * Windows 上原生标题栏按钮（titleBarOverlay）直接叠在应用顶部栏的右上角，
 * 顶部栏本身就是拖拽区域，不再单独渲染一条标题栏。
 */
export function WindowFrame({ children }: PropsWithChildren) {
  return (
    <div
      className={platform === 'win32' ? 'windows-frame' : undefined}
      style={{ '--app-header-height': `${UI_CONFIG.HEADER_HEIGHT}px` } as CSSProperties}
    >
      {children}
    </div>
  )
}
