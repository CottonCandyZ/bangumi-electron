import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import { MyLink } from '@renderer/components/my-link'
import { UI_CONFIG } from '@renderer/config'
import { InfoBoxWeb, InfoBoxWebValueLinkItem } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { Detail } from '@renderer/modules/main/subject/person/table/detail'

const BANGUMI_INTERNAL_LINK_PATTERN = /^\/(person|character|subject|ep)\/(\d+)\/?$/
const BANGUMI_HOSTS = new Set(['bgm.tv', 'bangumi.tv', 'chii.in'])

const LINK_CLASS_NAME =
  'text-primary decoration-primary/40 cursor-pointer underline-offset-2 hover:underline'

export function PersonsTable({ persons }: { persons: InfoBoxWeb }) {
  return (
    <dl className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 px-4 py-3 text-sm">
      {Array.from(persons).map(([key, value]) => {
        const label = key.slice(0, -2)
        const isBlockList = UI_CONFIG.INFO_BOX_INLINE_BLOCK.includes(label)

        return (
          <div
            className="border-border/50 col-span-2 grid grid-cols-subgrid border-b py-2 last:border-b-0"
            key={key}
          >
            <dt className="text-muted-foreground pt-px text-xs leading-5">{label}</dt>
            <dd className="leading-5 break-words whitespace-pre-wrap">
              {value.map((item, index) => {
                if (typeof item === 'string') {
                  if (isBlockList)
                    return (
                      <span
                        className={cn('inline-block', index !== value.length - 1 && 'pb-1')}
                        key={index}
                      >
                        {item}
                      </span>
                    )
                  return <span key={index}>{item}</span>
                }

                return <InfoBoxLink item={item} key={index} />
              })}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

function InfoBoxLink({ item }: { item: InfoBoxWebValueLinkItem }) {
  const route = getBangumiInternalRoute(item.href)
  const externalHref = getExternalHref(item.href)

  if (route?.type === 'person') {
    return (
      <HoverCard openDelay={300} closeDelay={200}>
        <HoverCardTrigger asChild className="inline-block">
          <MyLink to={route.to} className={LINK_CLASS_NAME}>
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
      <MyLink to={route.to} className={LINK_CLASS_NAME}>
        {item.name}
      </MyLink>
    )
  }

  return (
    <a
      href={externalHref}
      target="_blank"
      rel="noreferrer"
      className={LINK_CLASS_NAME}
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
