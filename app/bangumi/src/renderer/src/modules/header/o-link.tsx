import { HeaderButton } from '@renderer/components/tooltip-button/header-button'
import { Button } from '@renderer/components/ui/button'
import { HOST } from '@renderer/data/fetch/config/'
import { useLocation } from 'react-router-dom'

export function OriginalLink() {
  const { pathname } = useLocation()
  const episodePath = pathname.match(/^\/episode\/(\d+)/)
  const isOriginalLinkPath = /^\/(subject|person|character)\/\d+/.test(pathname) || !!episodePath
  const href = episodePath ? `${HOST}/ep/${episodePath[1]}` : `${HOST}${pathname}`

  return (
    isOriginalLinkPath && (
      <HeaderButton
        Button={
          <Button
            asChild
            variant="ghost"
            className="no-drag-region text-muted-foreground cursor-auto p-2 text-[1.4rem]"
          >
            <a href={href} target="_blank" rel="noreferrer">
              <span className="i-mingcute-world-2-line" />
            </a>
          </Button>
        }
        Content={<p>站点链接</p>}
      />
    )
  )
}
