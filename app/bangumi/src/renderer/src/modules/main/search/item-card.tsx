import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import type { SearchData, SearchMonoData, SearchSubjectData } from '@renderer/data/types/search'
import { cn } from '@renderer/lib/utils'
import { SUBJECT_TYPE_MAP } from '@renderer/lib/utils/map'
import {
  getSearchSubjectImage,
  getSearchSubjectSubtitle,
  getSearchSubjectTitle,
} from '@renderer/modules/main/search/utils'

export function SearchItemCard({ searchItem }: { searchItem: SearchData }) {
  if ('rating' in searchItem) return <SearchSubjectRow searchItem={searchItem} />
  return <SearchMonoRow searchItem={searchItem} />
}

function SearchMonoRow({ searchItem }: { searchItem: SearchMonoData }) {
  const image = searchItem.image || searchItem.images?.medium || searchItem.images?.grid
  const summary = searchItem.summary || searchItem.short_summary
  const isPerson = 'career' in searchItem
  const to = `/${isPerson ? 'person' : 'character'}/${searchItem.id}`

  return (
    <MyLink
      to={to}
      className="group focus-visible:ring-ring/50 block min-w-0 cursor-default focus-visible:ring-2 focus-visible:outline-hidden"
    >
      <Card className="group-hover:bg-accent rounded-none border-x-0 border-t-0 shadow-none transition-colors">
        <CardContent className="relative mx-auto flex min-h-[112px] w-full max-w-4xl min-w-0 flex-row items-stretch gap-4 p-3">
          {image ? (
            <Image
              imageSrc={image}
              className="bg-muted flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md"
              imageClassName="h-full w-full object-cover object-top"
              loadingClassName="h-24 w-16"
              careLoading
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex h-24 w-16 shrink-0 items-center justify-center rounded-md text-xs">
              --
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-2 py-0.5">
            <div className="min-w-0">
              <div className="line-clamp-1 text-base font-semibold">{searchItem.name}</div>
              <div className="text-muted-foreground line-clamp-1 text-xs">
                {isPerson ? '人物' : '角色'}
              </div>
            </div>
            <div className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
              {summary || '--'}
            </div>
          </div>
        </CardContent>
      </Card>
    </MyLink>
  )
}

export function SearchSubjectRow({
  searchItem,
  dense = false,
}: {
  searchItem: SearchSubjectData
  dense?: boolean
}) {
  const image = getSearchSubjectImage(searchItem)
  const title = getSearchSubjectTitle(searchItem)
  const subtitle = getSearchSubjectSubtitle(searchItem)
  const score = searchItem.rating.score
  const rank = searchItem.rating.rank
  const total = searchItem.rating.total
  const detailText = [SUBJECT_TYPE_MAP[searchItem.type], searchItem.date, searchItem.platform]
    .filter(Boolean)
    .join(' / ')

  return (
    <MyLink
      to={`/subject/${searchItem.id}`}
      className="group focus-visible:ring-ring/50 block min-w-0 cursor-default focus-visible:ring-2 focus-visible:outline-hidden"
    >
      <Card className="group-hover:bg-accent rounded-none border-x-0 border-t-0 shadow-none transition-colors">
        <CardContent
          className={cn(
            'relative mx-auto flex w-full max-w-4xl min-w-0 flex-row items-stretch gap-4 p-3',
            dense && 'gap-3 p-2',
          )}
        >
          {image ? (
            <Image
              imageSrc={image}
              className={cn(
                'bg-muted flex shrink-0 items-center justify-center overflow-hidden rounded-md',
                dense ? 'h-20 w-14' : 'h-28 w-20',
              )}
              imageClassName="h-full w-full object-cover"
              loadingClassName={dense ? 'h-20 w-14' : 'h-28 w-20'}
              careLoading
            />
          ) : (
            <div
              className={cn(
                'bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-md text-xs',
                dense ? 'h-20 w-14' : 'h-28 w-20',
              )}
            >
              --
            </div>
          )}

          {!dense && rank > 0 && (
            <Badge
              variant="secondary"
              className="absolute top-3 right-3 shrink-0 rounded-md font-medium tabular-nums"
            >
              Rank {rank}
            </Badge>
          )}

          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col gap-2 py-0.5',
              !dense && rank > 0 && 'pr-28',
            )}
          >
            <div className="min-w-0">
              <div className={cn('line-clamp-1 font-semibold', dense ? 'text-sm' : 'text-base')}>
                {title}
              </div>
              {subtitle && (
                <div className="text-muted-foreground line-clamp-1 text-xs">{subtitle}</div>
              )}
            </div>

            <div className="text-muted-foreground flex min-w-0 flex-row flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
              <span className="line-clamp-1">{detailText || searchItem.summary || '--'}</span>
              <span className="inline-flex items-baseline gap-1">
                评分
                <span
                  className="text-base font-semibold tabular-nums"
                  style={{ color: `hsl(var(--chart-score-${Math.floor(score + 0.5) || 1}))` }}
                >
                  {score > 0 ? score.toFixed(1) : '--'}
                </span>
              </span>
              <span>
                <span className="text-foreground font-medium">
                  {total > 0 ? total.toLocaleString() : '--'}
                </span>{' '}
                人参与
              </span>
            </div>

            {!dense && (
              <div className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                {searchItem.summary || '--'}
              </div>
            )}

            <div className="mt-auto flex min-w-0 flex-row flex-wrap gap-1.5">
              {searchItem.tags?.slice(0, dense ? 2 : 4).map((tag) => (
                <span
                  key={tag.name}
                  className="bg-secondary text-secondary-foreground rounded-md px-1.5 py-0.5 text-xs"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </MyLink>
  )
}

export function PinSearchButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 shadow-none"
          onClick={onClick}
        >
          <span className="i-mingcute-box-3-line text-lg" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">固定到左侧列表</TooltipContent>
    </Tooltip>
  )
}
