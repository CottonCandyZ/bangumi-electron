import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from '@renderer/components/ui/select'
import { CollectionEpisodes } from '@renderer/data/types/collection'
import { Episodes } from '@renderer/data/types/episode'
import { cn } from '@renderer/lib/utils'
import { getPageArrayFromTotal } from '@renderer/lib/utils/data-trans'

export function PageSelector({
  episodes,
  setOffSet,
  isPending,
  limit,
}: {
  episodes: Episodes | CollectionEpisodes
  setOffSet: React.Dispatch<React.SetStateAction<number>>
  isPending: boolean
  limit: number
}) {
  const selectArray = getPageArrayFromTotal(episodes.total)
  return (
    selectArray.length !== 1 && (
      <Select onValueChange={(value) => setOffSet(Number(value))} defaultValue="0">
        <SelectTrigger className={cn('w-min', isPending && 'text-muted-foreground')}>
          <div className="flex items-center gap-2">
            {isPending && <span className="i-mingcute-loading-line animate-spin" />}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent align="start">
          {selectArray.map((item) => (
            <SelectItem value={item.toString()} key={item}>
              {item + 1} - {item + limit}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  )
}
