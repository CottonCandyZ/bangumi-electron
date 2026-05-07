import { Button } from '@renderer/components/ui/button'
import { EPISODE_COLLECTION_ACTION } from '@renderer/constant/collection'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionEpisode, EpisodeCollectionType } from '@renderer/data/types/collection'
import { ModifyEpisodeCollectionOptType } from '@renderer/data/types/modify'
import { cn } from '@renderer/lib/utils'
import { useEpisodeCollectionActions } from '@renderer/modules/common/collections/use-episode-collection-actions'
import { useEffect, useState } from 'react'

type Props = {
  index: number
  subjectId: SubjectId
  episodes: CollectionEpisode[]
} & ModifyEpisodeCollectionOptType

export function EpisodeCollectionButton({
  index,
  subjectId,
  episodes,
  modifyEpisodeCollectionOpt,
}: Props) {
  const { currentAction, episodeCollectionType, mutateByAction, mutateNotCollected } =
    useEpisodeCollectionActions({
      index,
      subjectId,
      episodes,
      modifyEpisodeCollectionOpt,
    })
  const [hover, setHover] = useState(currentAction)

  useEffect(() => {
    setHover(currentAction)
  }, [currentAction])

  if (episodeCollectionType === undefined) return null

  return (
    <div className="flex h-9 flex-row gap-1">
      <div
        className={cn(
          'bg-muted text-muted-foreground inline-flex h-9 w-fit flex-wrap items-center justify-center rounded-md',
        )}
        onMouseLeave={() => setHover(currentAction)}
      >
        {EPISODE_COLLECTION_ACTION.map((item) => {
          if (episodeCollectionType === EpisodeCollectionType.watched && item === '看到')
            return null
          return (
            <button
              className={cn(
                `ring-offset-background hover:border-border hover:bg-background hover:text-foreground focus-visible:ring-ring relative inline-flex h-full cursor-pointer items-center justify-center rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50`,
                hover === item && 'border-border bg-background text-foreground',
                currentAction == item && 'cursor-default',
              )}
              key={item}
              onClick={(e) => {
                e.preventDefault()
                if (item === currentAction) return
                mutateByAction(item)
              }}
              onMouseEnter={() => setHover(item)}
            >
              {item}
            </button>
          )
        })}
      </div>
      {episodeCollectionType !== EpisodeCollectionType.notCollected && (
        <Button
          className="px-3 py-1"
          variant="outline"
          onClick={(e) => {
            e.preventDefault()
            mutateNotCollected()
          }}
        >
          撤销
        </Button>
      )}
    </div>
  )
}
