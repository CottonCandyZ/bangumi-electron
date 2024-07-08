import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from '@renderer/components/ui/select'
import { Episodes } from '@renderer/constants/types/episode'
import { cn } from '@renderer/lib/utils'
import { getPageArrayFromTotal } from '@renderer/lib/utils/data-trans'
import { UseQueryResult } from '@tanstack/react-query'

export default function PageSelector({
  episodes,
  setOffSet,
  limit,
}: {
  episodes: UseQueryResult<Episodes, Error>
  setOffSet: React.Dispatch<React.SetStateAction<number>>
  limit: number
}) {
  if (!episodes.data) return null
  const selectArray = getPageArrayFromTotal(episodes.data.total)
  return (
    selectArray.length !== 1 && (
      <Select onValueChange={(value) => setOffSet(Number(value))} defaultValue="0">
        <SelectTrigger className={cn('w-min', episodes.isFetching && 'text-muted-foreground')}>
          <div className="flex items-center gap-2">
            {episodes.isFetching && <span className="i-mingcute-loading-line animate-spin" />}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
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
