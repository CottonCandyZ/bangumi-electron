import { Button } from '@renderer/components/ui/button'
import { SubjectType } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'

const subjectTypeFilter = [
  { type: null, name: '全部' },
  { type: SubjectType.anime, name: '动画' },
  { type: SubjectType.book, name: '书籍' },
  { type: SubjectType.music, name: '音乐' },
  { type: SubjectType.game, name: '游戏' },
  { type: SubjectType.real, name: '三次元' },
]

export function SubjectTypeFilterButtons({
  filter,
  onFilterClick,
}: {
  filter: Set<SubjectType>
  onFilterClick: (filter: null | SubjectType) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {subjectTypeFilter.map((item) => (
        <Button
          key={item.name}
          variant="outline"
          className={cn(
            'cursor-default rounded-2xl shadow-none transition-all duration-500',
            ((item.type === null && filter.size === 0) ||
              (item.type !== null && filter.has(item.type))) &&
              'gap-2 bg-accent',
          )}
          onClick={() => {
            onFilterClick(item.type)
          }}
        >
          <span
            className={cn(
              'i-mingcute-check-line !w-0 transition-[width]',
              ((item.type === null && filter.size === 0) ||
                (item.type !== null && filter.has(item.type))) &&
                '!w-4',
            )}
          />
          {item.name}
        </Button>
      ))}
    </div>
  )
}
