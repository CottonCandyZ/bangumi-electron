import { HeaderButton } from '@renderer/components/tooltip-button/header-button'
import { Button } from '@renderer/components/ui/button'
import { HOST } from '@renderer/data/fetch/config/'
import { useLocation } from 'react-router-dom'

export function OriginalLink() {
  const { pathname } = useLocation()
  let href = ''
  const isSubject = pathname.includes('subject')
  if (isSubject) href = `${HOST}${pathname}`

  return (
    isSubject && (
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
