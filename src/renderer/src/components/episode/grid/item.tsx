import { Button } from '@renderer/components/ui/button'
import { Episode } from '@renderer/constants/types/episode'
import { cn } from '@renderer/lib/utils'

export default function EpisodeGridItem({ episode }: { episode: Episode }) {
  return (
    <Button
      key={episode.id}
      className={cn(
        'size-10',
        episode.sort.toString().length > 3 && 'w-12',
        episode.sort.toString().length > 4 && 'w-14',
      )}
      variant="outline"
    >
      {episode.sort}
    </Button>
  )
}
