import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import { MyLink } from '@renderer/components/my-link'
import { Table, TableBody, TableCell, TableRow } from '@renderer/components/ui/table'
import { UI_CONFIG } from '@renderer/config'
import { InfoBoxWeb, InfoBoxWebValueLinkItem } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { Detail } from '@renderer/modules/main/subject/person/table/detail'

const BANGUMI_INTERNAL_LINK_PATTERN = /^\/(person|character|subject|ep)\/(\d+)\/?$/
const BANGUMI_HOSTS = new Set(['bgm.tv', 'bangumi.tv', 'chii.in'])

export function PersonsTable({ persons }: { persons: InfoBoxWeb }) {
  return (
    <Table className="w-full">
      <TableBody>
        {Array.from(persons).map(([key, value]) => (
          <TableRow key={key}>
            <TableCell className="min-w-20 text-center font-medium">{key.slice(0, -2)}</TableCell>
            <TableCell className="break-all whitespace-pre-wrap">
              {value.map((item, index) => {
                if (typeof item === 'string') {
                  if (UI_CONFIG.INFO_BOX_INLINE_BLOCK.includes(key.slice(0, -2)))
                    return (
                      <span
                        className={cn('inline-block', index !== value.length - 1 && 'pb-2')}
                        key={index}
                      >
                        {item}
                      </span>
                    )
                  return <span key={index}>{item}</span>
                }

                return <InfoBoxLink item={item} key={index} />
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function InfoBoxLink({ item }: { item: InfoBoxWebValueLinkItem }) {
  const route = getBangumiInternalRoute(item.href)
  const externalHref = getExternalHref(item.href)

  if (route?.type === 'person') {
    return (
      <HoverCard openDelay={300} closeDelay={200}>
        <HoverCardTrigger className="inline-block">
          <MyLink
            to={route.to}
            className="decoration-primary/40 hover:decoration-primary cursor-pointer underline underline-offset-2"
          >
            {item.name}
          </MyLink>
        </HoverCardTrigger>
        <HoverCardContent side="top" className="w-full max-w-72 min-w-64">
          <Detail personId={route.id} />
        </HoverCardContent>
      </HoverCard>
    )
  }

  if (route) {
    return (
      <MyLink
        to={route.to}
        className="decoration-primary/40 hover:decoration-primary cursor-pointer underline underline-offset-2"
      >
        {item.name}
      </MyLink>
    )
  }

  return (
    <a
      href={externalHref}
      target="_blank"
      rel="noreferrer"
      className="decoration-primary/40 hover:decoration-primary cursor-pointer underline underline-offset-2"
      onClick={(event) => {
        event.preventDefault()
        window.open(externalHref, '_blank', 'noopener,noreferrer')
      }}
    >
      {item.name}
    </a>
  )
}

function getBangumiInternalRoute(href: string) {
  const pathname = getLinkPathname(href)
  const match = pathname?.match(BANGUMI_INTERNAL_LINK_PATTERN)

  if (!match) return undefined

  const [, type, id] = match
  const routeType = type === 'ep' ? 'episode' : type

  return {
    id,
    type,
    to: `/${routeType}/${id}`,
  }
}

function getLinkPathname(href: string) {
  if (href.startsWith('/')) return href

  try {
    const url = new URL(href)
    if (!BANGUMI_HOSTS.has(url.hostname)) return undefined
    return url.pathname
  } catch {
    return undefined
  }
}

function getExternalHref(href: string) {
  if (href.startsWith('//')) return `https:${href}`
  if (href.startsWith('/')) return `https://bgm.tv${href}`
  return href
}
