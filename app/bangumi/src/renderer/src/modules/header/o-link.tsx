import { HeaderButton } from '@renderer/components/tooltip-button/header-button'
import { Button } from '@renderer/components/ui/button'
import { useSession } from '@renderer/data/hooks/session'
import { getHotkeyForHook, isHotkeyEnabled } from '@renderer/lib/shortcut'
import { getSiteUrl, openInBrowser } from '@renderer/lib/site-url'
import { appConfigAtom } from '@renderer/state/app-config'
import { useAtomValue } from 'jotai'
import { useHotkeys } from 'react-hotkeys-hook'
import { useLocation } from 'react-router-dom'

export function OriginalLink() {
  const { pathname } = useLocation()
  const session = useSession()
  const hotkey = useAtomValue(appConfigAtom).shortcuts.openWebPage
  const href = getSiteUrl(pathname, session?.username)

  useHotkeys(
    getHotkeyForHook(hotkey),
    () => {
      if (href) openInBrowser(href)
    },
    { enabled: isHotkeyEnabled(hotkey) && !!href, preventDefault: true },
    [hotkey, href],
  )

  return (
    href && (
      <HeaderButton
        Button={
          <Button
            asChild
            variant="ghost"
            aria-label="在浏览器中打开网页版"
            className="no-drag-region text-muted-foreground size-7 cursor-auto p-1 text-lg"
          >
            <a href={href} target="_blank" rel="noreferrer">
              <span className="i-mingcute-world-2-line" />
            </a>
          </Button>
        }
        Content="在浏览器中打开网页版"
        hotkey={hotkey}
      />
    )
  )
}
