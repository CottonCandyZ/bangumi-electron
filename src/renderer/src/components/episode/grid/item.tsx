import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import { Button } from '@renderer/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import { Separator } from '@renderer/components/ui/separator'
import { Episode } from '@renderer/constants/types/episode'
import { cn } from '@renderer/lib/utils'
import { getDurationFromSeconds } from '@renderer/lib/utils/data-trans'
import { getOnAirStatus } from '@renderer/lib/utils/date'
import { isEmpty } from '@renderer/lib/utils/string'

export default function EpisodeGridItem({ episode }: { episode: Episode }) {
  const duration = getDurationFromSeconds(episode.duration_seconds)
  const variants = ['ghost', 'onAir', 'outline'] as const
  const status = getOnAirStatus(episode.airdate)
  const variant = variants[status]
  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger>
        <Button
          key={episode.id}
          className={cn(
            `size-10`,
            episode.sort.toString().length > 3 && 'w-12',
            episode.sort.toString().length > 4 && 'w-14',
          )}
          variant={variant}
        >
          {episode.sort}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-full min-w-64 max-w-96">
        <div className="flex flex-col gap-2">
          {!isEmpty(episode.name) && <Header {...episode} />}
          {!isEmpty(episode.desc) && (
            <>
              <ScrollWrapper className="max-h-32 pr-2">
                <p className="whitespace-pre-wrap">{episode.desc}</p>
              </ScrollWrapper>
              <Separator />
            </>
          )}
          {!isEmpty(episode.airdate) && <span className="text-sm">首播：{episode.airdate}</span>}
          {!isEmpty(episode.duration) && (
            <span className="text-sm">
              时长：
              {`${duration.hours.toString().padStart(2, '0')} :
            ${duration.mins.toString().padStart(2, '0')} : ${duration.seconds.toString().padStart(2, '0')}`}
            </span>
          )}

          <span className="text-sm">讨论：{episode.comment}</span>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

// 没有 CN 标题就直接显示
function Header({ name, name_cn }: { name: string; name_cn: string }) {
  if (isEmpty(name_cn)) return <h3 className="font-jp font-bold">{name}</h3>
  return (
    <header>
      <h3 className="font-bold">{name_cn}</h3>
      <h4 className="font font-jp text-sm font-medium text-muted-foreground">{name}</h4>
    </header>
  )
}
