import { Button } from '@renderer/components/ui/button'
import { SearchParam } from '@renderer/data/types/search'
import { cn } from '@renderer/lib/utils'

const sort = [
  { type: 'match', name: '最匹配' },
  { type: 'rank', name: '排名' },
  { type: 'score', name: '评分' },
  { type: 'heat', name: '热度' },
] as const

export function SortButton({
  value,
  onValueChanged,
  size = 'default',
  shape = 'pill',
}: {
  value: SearchParam['sort']
  onValueChanged: (value: SearchParam['sort']) => void
  size?: 'default' | 'sm'
  shape?: 'pill' | 'square'
}) {
  return (
    <div className={cn('flex min-w-0 flex-row flex-nowrap', size === 'sm' ? 'gap-1' : 'gap-2')}>
      {sort.map((item) => (
        <Button
          key={item.type}
          variant="ghost"
          className={cn(
            'shrink-0 shadow-none',
            shape === 'square' ? 'rounded-md' : 'rounded-2xl',
            size === 'sm' ? 'h-7 px-2 text-xs' : 'h-9 px-3',
            value === item.type && 'bg-accent',
          )}
          onClick={() => onValueChanged(item.type)}
        >
          {item.name}
        </Button>
      ))}
    </div>
  )
}
