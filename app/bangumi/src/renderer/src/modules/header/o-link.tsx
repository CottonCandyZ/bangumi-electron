import { HeaderButton } from '@renderer/components/tooltip-button/header-button'
import { Button } from '@renderer/components/ui/button'
import { HOST } from '@renderer/data/fetch/config/'
import { useSession } from '@renderer/data/hooks/session'
import { useLocation } from 'react-router-dom'

export function OriginalLink() {
  const { pathname } = useLocation()
  const session = useSession()
  const episodePath = pathname.match(/^\/episode\/(\d+)/)
  const groupTopicPath = pathname.match(/^\/group\/topic\/(\d+)/)
  const subjectTopicPath = pathname.match(/^\/subject\/topic\/(\d+)/)
  const userPath = pathname.match(/^\/user\/([^/]+)/)
  const profileUsername = pathname === '/profile' ? session?.username : undefined
  const isOriginalLinkPath =
    /^\/(subject|person|character)\/\d+/.test(pathname) ||
    !!episodePath ||
    !!groupTopicPath ||
    !!subjectTopicPath ||
    !!userPath ||
    !!profileUsername
  const href = episodePath
    ? `${HOST}/ep/${episodePath[1]}`
    : groupTopicPath
      ? `${HOST}/group/topic/${groupTopicPath[1]}`
      : subjectTopicPath
        ? `${HOST}/subject/topic/${subjectTopicPath[1]}`
        : userPath
          ? `${HOST}/user/${userPath[1]}`
          : profileUsername
            ? `${HOST}/user/${profileUsername}`
            : `${HOST}${pathname}`

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
