import { Button } from '@renderer/components/ui/button'
import { SearchParam } from '@renderer/data/types/search'
import { cn } from '@renderer/lib/utils'

const sort = [
  { type: 'match', name: '最匹配' },
  { type: 'rank', name: '排名' },
  { type: 'score', name: '评分' },
  { type: 'heat', name: '热度' },
] as const

export default function SortButton({
  value,
  onValueChanged,
}: {
  value: SearchParam['sort']
  onValueChanged: (value: SearchParam['sort']) => void
}) {
  return (
    <div className="flex flex-row gap-2">
      {sort.map((item) => (
        <Button
          key={item.type}
          variant="ghost"
          className={cn(value === item.type && 'bg-accent')}
          onClick={() => onValueChanged(item.type)}
        >
          {item.name}
        </Button>
      ))}
    </div>
  )
}
