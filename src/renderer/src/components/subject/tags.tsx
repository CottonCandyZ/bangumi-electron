import { Button } from '@renderer/components/ui/button'
import { Subject } from '@renderer/data/types/subject'

export default function Tags({ tags }: Pick<Subject, 'tags'>) {
  return (
    <div className="flex flex-row flex-wrap gap-2 after:grow-[999]">
      {tags.map((item) => (
        <Button
          key={item.name}
          className="h-auto flex-auto items-baseline justify-center gap-1 whitespace-normal px-1.5 py-1.5 text-xs"
          variant={'outline'}
          onClick={(e) => e.preventDefault()}
        >
          <span className="text-sm">{item.name}</span>
          <span className="text-xs text-muted-foreground">{item.count}</span>
        </Button>
      ))}
    </div>
  )
}
