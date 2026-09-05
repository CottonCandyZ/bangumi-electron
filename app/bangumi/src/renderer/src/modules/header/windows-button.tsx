import { client } from '@renderer/lib/client'
import { useTheme } from '@renderer/modules/wrapper/theme-wrapper'
import { useEffect } from 'react'

const platform = await client.platform({})

export function WindowsButton() {
  const { currentColor } = useTheme()
  useEffect(() => {
    if (platform === 'win32') {
      void client.setWindowControlsTheme({ dark: currentColor === 'dark' }).catch(console.error)
    }
  }, [currentColor])
  // Reserve the native overlay's actual width, including Windows DPI/fullscreen changes.
  return platform === 'win32' ? (
    <div
      aria-hidden="true"
      className="h-full shrink-0"
      style={{
        width:
          'max(0px, calc(100vw - env(titlebar-area-x, 0px) - env(titlebar-area-width, calc(100vw - 138px))))',
      }}
    />
  ) : null
}
