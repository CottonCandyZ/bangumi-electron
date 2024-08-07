import { Button } from '@renderer/components/ui/button'
import { HOST } from '@renderer/data/fetch/config'
import { useLocation } from 'react-router-dom'

export default function OriginalLink() {
  const { pathname } = useLocation()
  let href = ''
  const isSubject = pathname.includes('subject')
  if (isSubject) href = `${HOST}/${pathname}`
  return (
    isSubject && (
      <Button
        asChild
        variant="ghost"
        className="no-drag-region p-2 text-[1.4rem] text-muted-foreground"
      >
        <a href={href} target="_blank" rel="noreferrer">
          <span className="i-mingcute-link-line" />
        </a>
      </Button>
    )
  )
}
