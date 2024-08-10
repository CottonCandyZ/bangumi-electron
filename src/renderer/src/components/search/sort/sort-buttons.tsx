import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'

const sort = [
  { type: undefined, name: '默认排序' },
  { type: 'rank', name: '最高排名' },
] as const

export default function SortButton({
  value,
  onValueChanged,
}: {
  value: 'rank' | undefined
  onValueChanged: (value: 'rank' | undefined) => void
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
